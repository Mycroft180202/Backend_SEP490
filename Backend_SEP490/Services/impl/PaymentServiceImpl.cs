using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Backend_SEP490.Config;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using QRCoder;

namespace Backend_SEP490.Services.impl;

public class PaymentServiceImpl : GenericServices, IPaymentService
{
    private readonly INotificationService _notificationService;
    private readonly IOrderService _orderService;
    private readonly IVoucherService _voucherService;
    private readonly ICommerceRealtimeService _realtimeService;
    private readonly VnpaySettings _vnpaySettings;
    private readonly ILogger<PaymentServiceImpl> _logger;
    private static readonly string[] VietnamTimeZoneIds = { "SE Asia Standard Time", "Asia/Ho_Chi_Minh" };
    private TimeZoneInfo? _vietnamTimeZone;

    public PaymentServiceImpl(
        IMapper mapper,
        IUnitOfWork unitOfWork,
        INotificationService notificationService,
        IOrderService orderService,
        IVoucherService voucherService,
        ICommerceRealtimeService realtimeService,
        IOptions<VnpaySettings> vnpayOptions,
        ILogger<PaymentServiceImpl> logger) : base(mapper, unitOfWork)
    {
        _notificationService = notificationService;
        _orderService = orderService;
        _voucherService = voucherService;
        _realtimeService = realtimeService;
        _vnpaySettings = vnpayOptions.Value;
        _logger = logger;
    }

    public async Task<VnpayPaymentResponse?> CreateVnpayPaymentAsync(
        string userId,
        CreateVnpayPaymentRequest request,
        string clientIp)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return null;
        }

        var order = await _context.Order.GetAllOrderByIdAsync(request.OrderId);
        if (order == null || !string.Equals(order.CustomerId, userId, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("User {UserId} attempted to create VNPay payment for invalid order {OrderId}.", userId, request.OrderId);
            return null;
        }

        if (!string.Equals(order.PaymentType, "VNPAY", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Order {OrderId} is not configured for VNPay payments.", order.Id);
            return null;
        }

        if (order.TotalAmount < 0)
        {
            _logger.LogWarning("Order {OrderId} has invalid total amount {Total}.", order.Id, order.TotalAmount);
            return null;
        }

        if (string.Equals(order.Status, "Cancelled", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(order.Status, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Order {OrderId} is not eligible for payment (status: {Status}).", order.Id, order.Status);
            return null;
        }

        await using var transaction = await _context.BeginTransactionAsync();
        try
        {
            var (reserveSuccess, reserveMessage) = await ReserveOrderStockAsync(order);
            if (!reserveSuccess)
            {
                _logger.LogWarning(
                    "Unable to reserve inventory for order {OrderId}: {Message}",
                    order.Id,
                    reserveMessage ?? "Unknown error");
                await transaction.RollbackAsync();
                return null;
            }

            var existingPayments = await _context.Payments.GetByOrderIdAsync(order.Id);
            foreach (var pending in existingPayments.Where(p =>
                         string.Equals(p.Method, "VNPAY", StringComparison.OrdinalIgnoreCase) &&
                         string.Equals(p.PaymentStatus, "Pending", StringComparison.OrdinalIgnoreCase)))
            {
                pending.PaymentStatus = "Cancelled";
                pending.ProccessedAt = DateTime.UtcNow;
                pending.ProviderXlnd = null;
            }

            var paymentId = $"PAY-{Guid.NewGuid():N}";
            var bankCode = string.IsNullOrWhiteSpace(request.BankCode)
                ? _vnpaySettings.DefaultBankCode
                : request.BankCode!;

            var createdAtLocal = GetVietnamTime(DateTime.UtcNow);
            var expireAtLocal = createdAtLocal.AddMinutes(Math.Max(_vnpaySettings.ExpireMinutes, 5));
            var expireAtUtc = ConvertVietnamTimeToUtc(expireAtLocal);
            string paymentUrl;
            try
            {
                paymentUrl = BuildPaymentUrl(paymentId, order.OrderNumber, order.TotalAmount, bankCode, clientIp, createdAtLocal, expireAtLocal);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to build VNPay URL for order {OrderId}.", order.Id);
                await transaction.RollbackAsync();
                return null;
            }

            var payment = new Payment
            {
                Id = paymentId,
                OrderID = order.Id,
                Amount = order.TotalAmount,
                Method = "VNPAY",
                ProviderXlnd = bankCode,
                PaymentStatus = "Pending",
                ProccessedAt = DateTime.UtcNow
            };

            await _context.Payments.AddAsync(payment);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            var reservedItems = await EnsureOrderItemsLoadedAsync(order);
            await PublishInventoryRealtimeAsync(reservedItems, order.CustomerId);

            return new VnpayPaymentResponse
            {
                PaymentId = paymentId,
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                Amount = order.TotalAmount,
                PaymentUrl = paymentUrl,
                QrContent = GenerateQrContent(paymentUrl),
                ExpiredAt = expireAtUtc
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<VnpayCallbackResult> HandleVnpayCallbackAsync(IQueryCollection queryCollection)
    {
        var result = new VnpayCallbackResult
        {
            Success = false,
            Status = "Failed",
            Message = "Invalid payment data."
        };

        if (queryCollection == null || queryCollection.Count == 0)
        {
            return result;
        }

        var secureHash = queryCollection["vnp_SecureHash"].ToString();
        if (!ValidateSignature(queryCollection, secureHash))
        {
            result.Message = "Invalid signature.";
            return result;
        }

        var paymentId = queryCollection["vnp_TxnRef"].ToString();
        if (string.IsNullOrWhiteSpace(paymentId))
        {
            result.Message = "Missing transaction reference.";
            return result;
        }

        var payment = await _context.Payments.FindByIdAsync(paymentId);
        if (payment == null)
        {
            result.Message = "Payment not found.";
            return result;
        }

        var responseCode = queryCollection["vnp_ResponseCode"].ToString();
        var transactionNo = queryCollection["vnp_TransactionNo"].ToString();
        var status = string.Equals(responseCode, "00", StringComparison.OrdinalIgnoreCase) ? "Paid" : "Failed";

        if (decimal.TryParse(queryCollection["vnp_Amount"], out var rawAmount))
        {
            var paidAmount = rawAmount / 100m;
            if (paidAmount != payment.Amount)
            {
                _logger.LogWarning("Amount mismatch for payment {PaymentId}. Expected {Expected} but got {Actual}", payment.Id, payment.Amount, paidAmount);
            }
        }

        await ApplyPaymentStatusAsync(payment, status, transactionNo);

        result.Success = true;
        result.Status = status;
        result.OrderId = payment.OrderID;
        result.PaymentId = payment.Id;
        result.TransactionNo = transactionNo;

        var order = await _context.Order.GetAllOrderByIdAsync(payment.OrderID);
        result.OrderNumber = order?.OrderNumber;
        result.Message = string.Equals(status, "Paid", StringComparison.OrdinalIgnoreCase)
            ? "Payment successful."
            : "Payment failed.";

        return result;
    }

    public async Task<string> UpdatePaymentStatusAsync(UpdatePaymentStatusRequest request)
    {
        var payment = await _context.Payments.FindByIdAsync(request.PaymentId);
        if (payment == null)
        {
            return "Payment not found!";
        }

        await ApplyPaymentStatusAsync(payment, request.Status, null);
        return "Payment status updated successfully!";
    }

    private async Task ApplyPaymentStatusAsync(Payment payment, string status, string? providerReference)
    {
        var wasPaid = string.Equals(payment.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase);
        var normalizedStatus = string.IsNullOrWhiteSpace(status) ? "Pending" : status.Trim();
        payment.PaymentStatus = normalizedStatus;
        payment.ProccessedAt = DateTime.UtcNow;
        payment.ProviderXlnd = providerReference;

        var isPaid = string.Equals(normalizedStatus, "Paid", StringComparison.OrdinalIgnoreCase);
        var becamePaid = isPaid && !wasPaid;

        if (isPaid)
        {
            var siblings = await _context.Payments.GetByOrderIdAsync(payment.OrderID);
            foreach (var sibling in siblings.Where(p =>
                         !string.Equals(p.Id, payment.Id, StringComparison.OrdinalIgnoreCase) &&
                         string.Equals(p.PaymentStatus, "Pending", StringComparison.OrdinalIgnoreCase)))
            {
                sibling.PaymentStatus = "Cancelled";
                sibling.ProccessedAt = DateTime.UtcNow;
                sibling.ProviderXlnd = null;
            }
        }

        _context.Payments.Update(payment);
        await _context.SaveChangesAsync();

        var order = await _context.Order.GetAllOrderByIdAsync(payment.OrderID);
        await PublishPaymentRealtimeAsync(payment, order);
        var customerId = order?.CustomerId;
        var orderNumber = order?.OrderNumber;

        if (isPaid)
        {
            if (order != null)
            {
                if (becamePaid)
                {
                    await UpdateProductSaleQuantitiesAsync(order);
                    await _voucherService.TryGrantLargeOrderVoucherAsync(order);
                }

                await UpdateOrderStatusToPaidAsync(order);
            }

            if (becamePaid &&
                !string.IsNullOrWhiteSpace(customerId) &&
                ShouldClearCartAfterPayment(order, normalizedStatus))
            {
                var orderItems = await EnsureOrderItemsLoadedAsync(order);
                await RemoveUserCartItemsAsync(customerId!, orderItems.Select(i => i.ProductID));
            }
        }
        else if (order != null &&
                 string.Equals(order.PaymentType, "VNPAY", StringComparison.OrdinalIgnoreCase))
        {
            await RestoreOrderStockAsync(order);
            await ReleaseVoucherUsageForPotentialGroupAsync(order);
            await _context.SaveChangesAsync();
            var restoredItems = await EnsureOrderItemsLoadedAsync(order);
            await PublishInventoryRealtimeAsync(restoredItems, null);
        }

        if (!string.IsNullOrWhiteSpace(customerId))
        {
            await _notificationService.NotifyPaymentStatusAsync(payment, customerId!, orderNumber);
        }

        if (becamePaid)
        {
            await _orderService.CreateShipmentsAfterPaymentAsync(payment.OrderID);
        }

        await PublishOrderRealtimeAsync(order, $"Payment status updated: {normalizedStatus}");
    }

    private static bool ShouldClearCartAfterPayment(Order? order, string normalizedStatus)
    {
        if (order == null)
        {
            return false;
        }

        if (!string.Equals(normalizedStatus, "Paid", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(order.PaymentType))
        {
            return false;
        }

        return string.Equals(order.PaymentType, "COD", StringComparison.OrdinalIgnoreCase) ||
               string.Equals(order.PaymentType, "VNPAY", StringComparison.OrdinalIgnoreCase);
    }

    private string BuildPaymentUrl(string txnRef, string? orderNumber, decimal amount, string bankCode, string clientIp, DateTime createdAtLocal, DateTime expireAtLocal)
    {
        if (string.IsNullOrWhiteSpace(_vnpaySettings.PaymentUrl) ||
            string.IsNullOrWhiteSpace(_vnpaySettings.TmnCode) ||
            string.IsNullOrWhiteSpace(_vnpaySettings.HashSecret))
        {
            throw new InvalidOperationException("VNPAY settings are missing.");
        }

        var now = createdAtLocal;
        var expireLocal = expireAtLocal;
        var data = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Version"] = _vnpaySettings.Version,
            ["vnp_Command"] = _vnpaySettings.Command,
            ["vnp_TmnCode"] = _vnpaySettings.TmnCode,
            ["vnp_Amount"] = ((long)Math.Round(amount * 100, 0)).ToString(),
            ["vnp_CreateDate"] = now.ToString("yyyyMMddHHmmss"),
            ["vnp_ExpireDate"] = expireLocal.ToString("yyyyMMddHHmmss"),
            ["vnp_CurrCode"] = _vnpaySettings.CurrencyCode,
            ["vnp_IpAddr"] = string.IsNullOrWhiteSpace(clientIp) ? "127.0.0.1" : clientIp,
            ["vnp_Locale"] = _vnpaySettings.Locale,
            ["vnp_OrderInfo"] = $"Thanh toan don hang {orderNumber ?? txnRef}",
            ["vnp_OrderType"] = "billpayment",
            ["vnp_ReturnUrl"] = _vnpaySettings.ReturnUrl,
            ["vnp_TxnRef"] = txnRef
        };

        if (!string.IsNullOrWhiteSpace(bankCode))
        {
            data["vnp_BankCode"] = bankCode;
        }

        var query = new List<string>();
        foreach (var kvp in data)
        {
            query.Add($"{WebUtility.UrlEncode(kvp.Key)}={WebUtility.UrlEncode(kvp.Value)}");
        }

        var rawData = string.Join('&', query);
        var secureHash = ComputeHmac(_vnpaySettings.HashSecret, rawData);
        return $"{_vnpaySettings.PaymentUrl}?{rawData}&vnp_SecureHash={secureHash}";
    }

    private bool ValidateSignature(IQueryCollection queryCollection, string secureHash)
    {
        if (string.IsNullOrWhiteSpace(secureHash))
        {
            return false;
        }

        var data = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var key in queryCollection.Keys)
        {
            if (string.Equals(key, "vnp_SecureHash", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(key, "vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var value = queryCollection[key].ToString();
            if (!string.IsNullOrWhiteSpace(value))
            {
                data[key] = value;
            }
        }

        var query = new List<string>();
        foreach (var kvp in data.OrderBy(k => k.Key, StringComparer.Ordinal))
        {
            query.Add($"{WebUtility.UrlEncode(kvp.Key)}={WebUtility.UrlEncode(kvp.Value)}");
        }

        var rawData = string.Join('&', query);
        var calculatedHash = ComputeHmac(_vnpaySettings.HashSecret, rawData);
        return string.Equals(calculatedHash, secureHash, StringComparison.OrdinalIgnoreCase);
    }

    private static string ComputeHmac(string secret, string data)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secret ?? string.Empty);
        var inputBytes = Encoding.UTF8.GetBytes(data ?? string.Empty);

        using var hmac = new HMACSHA512(keyBytes);
        var hashBytes = hmac.ComputeHash(inputBytes);
        var builder = new StringBuilder();
        foreach (var b in hashBytes)
        {
            builder.Append(b.ToString("x2"));
        }

        return builder.ToString();
    }

    private static string GenerateQrContent(string paymentUrl)
    {
        if (string.IsNullOrWhiteSpace(paymentUrl))
        {
            return string.Empty;
        }

        using var qrGenerator = new QRCodeGenerator();
        using var qrData = qrGenerator.CreateQrCode(paymentUrl, QRCodeGenerator.ECCLevel.Q);
        var qrCode = new PngByteQRCode(qrData);
        var qrBytes = qrCode.GetGraphic(20);
        return $"data:image/png;base64,{Convert.ToBase64String(qrBytes)}";
    }

    private DateTime GetVietnamTime(DateTime utcNow)
    {
        var timeZone = ResolveVietnamTimeZone();
        return timeZone != null
            ? TimeZoneInfo.ConvertTimeFromUtc(utcNow, timeZone)
            : DateTime.SpecifyKind(utcNow.AddHours(7), DateTimeKind.Unspecified);
    }

    private DateTime ConvertVietnamTimeToUtc(DateTime localTime)
    {
        var timeZone = ResolveVietnamTimeZone();
        var unspecified = DateTime.SpecifyKind(localTime, DateTimeKind.Unspecified);
        return timeZone != null
            ? TimeZoneInfo.ConvertTimeToUtc(unspecified, timeZone)
            : DateTime.SpecifyKind(localTime.AddHours(-7), DateTimeKind.Utc);
    }

    private TimeZoneInfo? ResolveVietnamTimeZone()
    {
        if (_vietnamTimeZone != null)
        {
            return _vietnamTimeZone;
        }

        foreach (var timeZoneId in VietnamTimeZoneIds)
        {
            try
            {
                _vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
                return _vietnamTimeZone;
            }
            catch (TimeZoneNotFoundException)
            {
                // Try next time zone id
            }
            catch (InvalidTimeZoneException)
            {
                // Try next time zone id
            }
        }

        _logger.LogWarning("Unable to resolve Vietnam time zone using known identifiers. Falling back to UTC+7 offset.");
        return null;
    }

    private async Task UpdateOrderStatusToPaidAsync(Order order)
    {
        if (order == null)
        {
            return;
        }

        if (string.Equals(order.Status, "Shipping", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(order.Status, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (!string.Equals(order.Status, "Paid", StringComparison.OrdinalIgnoreCase))
        {
            order.Status = "Paid";
            await _context.SaveChangesAsync();
        }
    }

    private async Task UpdateProductSaleQuantitiesAsync(Order order)
    {
        if (order == null)
        {
            return;
        }

        var orderItems = await EnsureOrderItemsLoadedAsync(order);
        if (orderItems == null || orderItems.Count == 0)
        {
            return;
        }

        var productIds = orderItems
            .Where(item => !string.IsNullOrWhiteSpace(item.ProductID))
            .Select(item => item.ProductID!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (productIds.Count == 0)
        {
            return;
        }

        var products = await _context.Products.GetProductsByIdsAsync(productIds);
        var lookup = products
            .Where(p => !string.IsNullOrWhiteSpace(p.Id))
            .ToDictionary(p => p.Id!.Trim(), StringComparer.OrdinalIgnoreCase);

        var updated = false;

        foreach (var item in orderItems)
        {
            if (string.IsNullOrWhiteSpace(item.ProductID))
            {
                continue;
            }

            if (!lookup.TryGetValue(item.ProductID.Trim(), out var product))
            {
                continue;
            }

            var quantity = Math.Max(item.Quantity, 0);
            if (quantity <= 0)
            {
                continue;
            }

            product.QuantitySale += quantity;
            updated = true;
        }

        if (updated)
        {
            await _context.SaveChangesAsync();
        }
    }


    private async Task PublishInventoryRealtimeAsync(IEnumerable<OrderItem> orderItems, string? excludeUserId)
    {
        if (orderItems == null)
        {
            return;
        }

        var productIds = orderItems
            .Where(item => !string.IsNullOrWhiteSpace(item.ProductID))
            .Select(item => item.ProductID!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (productIds.Count == 0)
        {
            return;
        }

        var stockUpdates = new List<RealtimeProductStockDto>();
        var adjustmentDtos = new List<RealtimeCartItemAdjustmentDto>();

        foreach (var productId in productIds)
        {
            var product = await _context.Products.GetProductByIdAsync(productId);
            if (product == null)
            {
                continue;
            }

            stockUpdates.Add(new RealtimeProductStockDto
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Stock = product.Stock,
                IsActive = product.IsActive
            });

            var adjustments = await SynchronizeCartItemsWithProductStockAsync(product.Id, excludeUserId);
            if (adjustments.Count > 0)
            {
                adjustmentDtos.AddRange(BuildCartAdjustmentDtos(adjustments));
            }
        }

        if (stockUpdates.Count > 0)
        {
            await _realtimeService.BroadcastProductStockAsync(stockUpdates);
        }

        if (adjustmentDtos.Count > 0)
        {
            await _realtimeService.SendCartAdjustmentsAsync(adjustmentDtos);
        }
    }

    private Task PublishPaymentRealtimeAsync(Payment payment, Order? order)
    {
        if (payment == null || order == null || string.IsNullOrWhiteSpace(order.CustomerId))
        {
            return Task.CompletedTask;
        }

        var dto = new RealtimePaymentDto
        {
            PaymentId = payment.Id,
            OrderId = payment.OrderID,
            OrderNumber = order.OrderNumber,
            Status = payment.PaymentStatus,
            Amount = payment.Amount,
            ProcessedAt = payment.ProccessedAt,
            ProviderCode = payment.ProviderXlnd
        };

        return _realtimeService.SendPaymentUpdateAsync(order.CustomerId!, dto);
    }

    private Task PublishOrderRealtimeAsync(Order? order, string? message)
    {
        if (order == null || string.IsNullOrWhiteSpace(order.CustomerId))
        {
            return Task.CompletedTask;
        }

        var dto = new RealtimeOrderDto
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            Status = order.Status,
            TotalAmount = order.TotalAmount,
            PaymentType = order.PaymentType,
            UpdatedAt = DateTime.UtcNow,
            Message = message
        };

        return _realtimeService.SendOrderUpdateAsync(order.CustomerId!, dto);
    }

}
