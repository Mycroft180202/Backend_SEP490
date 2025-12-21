
using Backend_SEP490.Data;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using Backend_SEP490.Config;
using Backend_SEP490.Constants;
using Backend_SEP490.DTOs.External.Ghn;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Repositories.impl;
using Backend_SEP490.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Backend_SEP490.Services.impl;

public class OrderServiceImpl : GenericServices, IOrderService
{
    private const string PlatformSellerId = "PLATFORM";
    private const string PaymentTypeCod = "COD";
    private const string PaymentTypeVnpay = "VNPAY";
    private const int SellerPenaltyPoints = 5;
    private static readonly TimeSpan DuplicateOrderWindow = TimeSpan.FromSeconds(60);
    private const int DuplicateOrderLookbackLimit = 5;

    private readonly INotificationService _notificationService;
    private readonly IGhnShippingService _ghnShippingService;
    private readonly IShipmentRealtimeService _shipmentRealtimeService;
    private readonly IVoucherService _voucherService;
    private readonly ISellerReputationService _sellerReputationService;
    private readonly ILogger<OrderServiceImpl> _logger;
    private readonly ICommerceRealtimeService _realtimeService;
    private readonly GhnSettings _ghnSettings;

    public OrderServiceImpl(
        IMapper mapper,
        IUnitOfWork unitOfWork,
        INotificationService notificationService,
        IGhnShippingService ghnShippingService,
        IShipmentRealtimeService shipmentRealtimeService,
        IVoucherService voucherService,
        ISellerReputationService sellerReputationService,
        ICommerceRealtimeService realtimeService,
        IOptions<GhnSettings> ghnOptions,
        ILogger<OrderServiceImpl> logger) : base(mapper, unitOfWork)
    {
        _notificationService = notificationService;
        _ghnShippingService = ghnShippingService;
        _shipmentRealtimeService = shipmentRealtimeService;
        _voucherService = voucherService;
        _sellerReputationService = sellerReputationService;
        _realtimeService = realtimeService;
        _logger = logger;
        _ghnSettings = ghnOptions.Value;
    }

    private static string GenerateId(string prefix) => $"{prefix}-{DateTime.UtcNow:yyyyMMdd-HHmmssfff}";

    private static string BuildOrderItemSignature(IEnumerable<(string ProductId, int Quantity, decimal UnitPrice)> items)
    {
        if (items == null)
        {
            return string.Empty;
        }

        return string.Join(
            "|",
            items
                .Where(i => !string.IsNullOrWhiteSpace(i.ProductId))
                .Select(i => (ProductId: i.ProductId.Trim(), Quantity: Math.Max(i.Quantity, 0), UnitPrice: Math.Max(i.UnitPrice, 0m)))
                .OrderBy(i => i.ProductId, StringComparer.OrdinalIgnoreCase)
                .ThenBy(i => i.UnitPrice)
                .Select(i => $"{i.ProductId}:{i.Quantity}:{i.UnitPrice:0.################}"));
    }

    public async Task<CreateOrderResult> CreateOrderAsync(string? userId, RequestCreateOrder request)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return CreateOrderResult.Failure("User id is required.");
        }

        if (request == null)
        {
            return CreateOrderResult.Failure("Request payload is required.");
        }

        if (string.IsNullOrWhiteSpace(request.AddressId))
        {
            return CreateOrderResult.Failure("addressId is required.");
        }

        var paymentType = NormalizePaymentType(request.PaymentMethod);
        if (paymentType == null)
        {
            return CreateOrderResult.Failure("Payment method must be COD or VNPAY!");
        }

        var address = await _context.Address.GetAddressByIdAsync(request.AddressId);
        if (address == null || !string.Equals(address.UserID, userId, StringComparison.OrdinalIgnoreCase))
        {
            return CreateOrderResult.Failure("Shipping address not found.");
        }

        if (!address.GhnDistrictId.HasValue || string.IsNullOrWhiteSpace(address.GhnWardCode))
        {
            return CreateOrderResult.Failure("Shipping address is missing district/ward information.");
        }

        var customer = await _context.Users.GetByIdAsync(userId);
        if (customer == null)
        {
            return CreateOrderResult.Failure("Customer not found!");
        }

        await using var transaction = await _context.BeginTransactionAsync();

        try
        {
            var (itemsResolved, orderItemInputs, itemError) = await ResolveOrderItemsAsync(userId, request);
            if (!itemsResolved)
            {
                await transaction.RollbackAsync();
                return CreateOrderResult.Failure(itemError ?? "Unable to resolve order items.");
            }

            if (orderItemInputs.Count == 0)
            {
                await transaction.RollbackAsync();
                return CreateOrderResult.Failure("No order items specified.");
            }

            var artisanIds = orderItemInputs
                .Select(info => info.Product?.ArtisanId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (artisanIds.Count != 1)
            {
                await transaction.RollbackAsync();
                return CreateOrderResult.Failure("Moi don hang chi duoc phep chua san pham tu mot cua hang. Vui long tao don rieng.");
            }

            var artisanId = artisanIds[0];

            var subtotal = orderItemInputs.Sum(info => info.UnitPrice * info.Quantity);

            //var shippingAddress = await CreateOrderShippingAddressAsync(userId, address);
            if (address == null)
            {
                await transaction.RollbackAsync();
                return CreateOrderResult.Failure("Unable to save shipping address for this order.");
            }

            var (feeSuccess, shippingFee, resolvedServiceId, feeError) = await CalculateShippingFeeAsync(
                request,
                address);
            if (!feeSuccess)
            {
                await transaction.RollbackAsync();
                return CreateOrderResult.Failure(feeError ?? "Unable to calculate shipping fee.");
            }

            var normalizedVoucherCode = string.IsNullOrWhiteSpace(request.VoucherCodeId)
                ? null
                : request.VoucherCodeId.Trim();

            var candidateSignature = BuildOrderItemSignature(orderItemInputs.Select(i => (i.ProductId, i.Quantity, i.UnitPrice)));
            var candidateServiceId = resolvedServiceId ?? -1;
            var candidateServiceTypeId = request.ServiceTypeId ?? _ghnSettings.ServiceTypeId;
            var candidateRequiredNote = request.RequiredNote;
            var candidatePaymentTypeId = request.PaymentTypeId;
            var recentOrders = await _context.Order.GetRecentOrdersForCustomerAsync(
                userId,
                DateTime.UtcNow.Subtract(DuplicateOrderWindow),
                DuplicateOrderLookbackLimit);

            var duplicateOrder = recentOrders.FirstOrDefault(o =>
            {
                if (o == null)
                {
                    return false;
                }

                if (!string.Equals(o.PaymentType, paymentType, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                if (!string.Equals(o.ShipingAddressId, address.Id, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                if (!string.Equals(o.VoucherCode, normalizedVoucherCode, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                if (o.ShippingServiceId != candidateServiceId)
                {
                    return false;
                }

                if (o.ShippingServiceTypeId != candidateServiceTypeId)
                {
                    return false;
                }

                if (o.ShippingPaymentTypeId != candidatePaymentTypeId)
                {
                    return false;
                }

                if (!string.Equals(o.ShippingRequiredNote, candidateRequiredNote, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                var existingSignature = BuildOrderItemSignature((o.OrderItems ?? Array.Empty<OrderItem>())
                    .Select(oi => (oi.ProductID ?? string.Empty, oi.Quantity, oi.UnitPrice)));

                return string.Equals(existingSignature, candidateSignature, StringComparison.Ordinal);
            });

            if (duplicateOrder != null)
            {
                await transaction.RollbackAsync();
                var duplicateResponse = CreateOrderResult.Succeeded(
                    duplicateOrder.Id,
                    duplicateOrder.PaymentType,
                    duplicateOrder.SubtotalAmount,
                    duplicateOrder.DiscountAmount,
                    duplicateOrder.ShippingFee,
                    duplicateOrder.TotalAmount,
                    duplicateOrder.Status,
                    duplicateOrder.VoucherCode) with
                {
                    Message = "Duplicate request detected. Returning existing order."
                };

                return duplicateResponse;
            }

            var (voucherSuccess, discountAmount, voucher, voucherError) =
                await ApplyVoucherAsync(userId, request.VoucherCodeId, subtotal);
            if (!voucherSuccess)
            {
                await transaction.RollbackAsync();
                return CreateOrderResult.Failure(voucherError ?? "Unable to apply voucher.");
            }

            var totalAmount = Math.Max(0m, subtotal - discountAmount + shippingFee);
            var resolvedShippingServiceId = resolvedServiceId ?? -1;

            var orderId = $"Order-{userId}-{Guid.NewGuid():N}";
            var order = new Order
            {
                Id = orderId,
                OrderNumber = GenerateId("ORDER"),
                CustomerId = userId,
                Status = OrderStatuses.WaitingForPickup,
                PaymentType = paymentType,
                TotalAmount = totalAmount,
                SubtotalAmount = subtotal,
                DiscountAmount = discountAmount,
                ShippingFee = shippingFee,
                ShipingAddressId = address.Id,
                ShippingServiceId = resolvedShippingServiceId,
                ShippingServiceTypeId = request.ServiceTypeId ?? _ghnSettings.ServiceTypeId,
                ShippingPaymentTypeId = request.PaymentTypeId,
                ShippingRequiredNote = request.RequiredNote,
                ShippingToProvinceId = address.GhnProvinceId,
                ShippingToDistrictId = address.GhnDistrictId,
                ShippingToWardCode = address.GhnWardCode,
                VoucherCode = voucher?.Code ?? request.VoucherCodeId?.Trim(),
                VoucherId = voucher?.VoucherId,
                CreateAt = DateTime.UtcNow
            };

            var addOrderStatus = await _context.Order.CreateOrderAsync(order);
            if (!addOrderStatus)
            {
                await transaction.RollbackAsync();
                return CreateOrderResult.Failure("Create order failed!(addOrderStatus)");
            }

            var orderItems = orderItemInputs
                .Select(info => new OrderItem
                {
                    Id = $"{orderId}-{info.ProductId}",
                    OrderID = orderId,
                    ProductID = info.ProductId,
                    Quantity = info.Quantity,
                    UnitPrice = info.UnitPrice
                })
                .ToList();
            order.OrderItems = orderItems;

            var addOrderItemStatus = await _context.OrderDetail.CreateOrderItemAsync(orderItems);
            if (!addOrderItemStatus)
            {
                await transaction.RollbackAsync();
                return CreateOrderResult.Failure("Create order item failed!(addOrderItemStatus)");
            }

            if (string.Equals(paymentType, PaymentTypeCod, StringComparison.OrdinalIgnoreCase))
            {
                var (reserveSuccess, reserveMessage) = await ReserveOrderStockAsync(order);
                if (!reserveSuccess)
                {
                    await transaction.RollbackAsync();
                    return CreateOrderResult.Failure(reserveMessage ?? "Insufficient stock available for this order.");
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            await PublishInventoryRealtimeAsync(orderItems, order.CustomerId);

            var response = CreateOrderResult.Succeeded(
                orderId,
                paymentType,
                subtotal,
                discountAmount,
                shippingFee,
                totalAmount,
                order.Status,
                order.VoucherCode);

            if (string.Equals(paymentType, PaymentTypeCod, StringComparison.OrdinalIgnoreCase))
            {
                var baseOptions = BuildBaseShipmentOptions(address, customer, order);
                var shipmentResult = await TryCreateGhnShipmentsAsync(order, orderItems, address, customer, baseOptions);
                if (shipmentResult.AnyShipmentsCreated)
                {
                    var providerData = shipmentResult.ProviderResponses
                        .Select(r => r?.Data)
                        .FirstOrDefault(d => d != null && !string.IsNullOrWhiteSpace(d.OrderCode));

                    if (providerData != null)
                    {
                        response = response with
                        {
                            GhnOrderCode = providerData.OrderCode,
                            ExpectedDelivery = providerData.ExpectedDeliveryTime,
                            Message = "Order created successfully (COD)",
                            Status = order.Status
                        };

                        if (providerData.TotalFee.HasValue)
                        {
                            order.ShippingProviderFee = providerData.TotalFee.Value;
                            order.ExpectedDelivery = providerData.ExpectedDeliveryTime;
                            await _context.SaveChangesAsync();
                        }
                    }
                    else
                    {
                        response = response with
                        {
                            Message = "Order created successfully (COD)",
                            Status = order.Status
                        };
                    }
                }
                else
                {
                    response = response with
                    {
                        Message = "Order created successfully (COD)",
                        Status = order.Status
                    };
                }
            }
            else
            {
                response = response with { Message = "Redirect to VNPay", Status = order.Status };
            }

            await NotifyOrderActorsAsync(order, orderItems);

            if (string.Equals(paymentType, PaymentTypeCod, StringComparison.OrdinalIgnoreCase))
            {
                await ClearUserCartAsync(userId);
            }

            await PublishOrderRealtimeAsync(order, response.Message ?? "Order created");
            return response;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<(bool Success, decimal Fee, int? ServiceIdUsed, string? Message)> PreviewCartShippingFeeAsync(
        string? userId,
        int toDistrictId,
        string toWardCode,
        int? serviceId,
        int? serviceTypeId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return (false, 0m, null, "User id is required.");
        }

        if (toDistrictId <= 0 || string.IsNullOrWhiteSpace(toWardCode))
        {
            return (false, 0m, null, "Destination is required.");
        }

        var previewRequest = new RequestCreateOrder
        {
            ShippingServiceId = serviceId ?? _ghnSettings.ServiceId,
            ServiceTypeId = serviceTypeId ?? _ghnSettings.ServiceTypeId,
            PaymentMethod = PaymentTypeCod,
            RequiredNote = _ghnSettings.RequiredNote,
            PaymentTypeId = _ghnSettings.PaymentTypeId
        };

        var (itemsResolved, orderItemInputs, itemError) = await ResolveOrderItemsAsync(userId, previewRequest);
        if (!itemsResolved || orderItemInputs.Count == 0)
        {
            return (false, 0m, null, itemError ?? "Cart is empty.");
        }

        var artisanIds = orderItemInputs
            .Select(info => info.Product?.ArtisanId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (artisanIds.Count != 1)
        {
            return (false, 0m, null, "Moi don hang chi duoc phep chua san pham tu mot cua hang. Vui long tao don rieng.");
        }

        var destination = new Address
        {
            GhnDistrictId = toDistrictId,
            GhnWardCode = toWardCode
        };

        var (feeSuccess, fee, serviceIdUsed, feeError) = await CalculateShippingFeeAsync(
            previewRequest,
            destination);

        if (!feeSuccess)
        {
            return (false, 0m, null, feeError ?? "Unable to calculate shipping fee.");
        }

        return (true, fee, serviceIdUsed, null);
    }

    public async Task<(bool Success, decimal Fee, int? ServiceIdUsed, string? Message)> PreviewSimpleShippingFeeAsync(
        int toDistrictId,
        string toWardCode,
        int? serviceId,
        int? serviceTypeId)
    {
        if (toDistrictId <= 0 || string.IsNullOrWhiteSpace(toWardCode))
        {
            return (false, 0m, null, "Destination is required.");
        }

        if (_ghnSettings.FromDistrictId <= 0 || string.IsNullOrWhiteSpace(_ghnSettings.FromWardCode))
        {
            return (false, 0m, null, "Thiếu cấu hình địa chỉ lấy hàng GHN (FromDistrictId/FromWardCode).");
        }

        var baseRequestModel = new GhnCalculateFeeRequest
        {
            ShopId = _ghnSettings.ShopId > 0 ? _ghnSettings.ShopId : null,
            TokenOverride = null,
            FromDistrictId = _ghnSettings.FromDistrictId,
            FromWardCode = _ghnSettings.FromWardCode,
            ServiceTypeId = serviceTypeId,
            ToDistrictId = toDistrictId,
            ToWardCode = toWardCode,
            Weight = Math.Max(_ghnSettings.DefaultItemWeight, 1000),
            Length = _ghnSettings.DefaultParcelLength,
            Width = _ghnSettings.DefaultParcelWidth,
            Height = _ghnSettings.DefaultParcelHeight,
            InsuranceValue = _ghnSettings.DefaultInsuranceValue ?? 0
        };

        var serviceCandidates = new List<int?>();
        if (serviceId.HasValue && serviceId.Value > 0)
        {
            serviceCandidates.Add(serviceId);
        }
        if (_ghnSettings.ServiceId.HasValue && _ghnSettings.ServiceId.Value > 0)
        {
            serviceCandidates.Add(_ghnSettings.ServiceId);
        }

        var distinctCandidates = serviceCandidates
            .Select(id => id.HasValue && id.Value <= 0 ? null : id)
            .Distinct()
            .ToList();

        var successCodes = new[] { 0, 200 };
        string? lastErrorMessage = null;

        foreach (var candidateServiceId in distinctCandidates)
        {
            var requestModel = new GhnCalculateFeeRequest
            {
                ShopId = baseRequestModel.ShopId,
                TokenOverride = baseRequestModel.TokenOverride,
                FromDistrictId = baseRequestModel.FromDistrictId,
                FromWardCode = baseRequestModel.FromWardCode,
                ServiceId = candidateServiceId,
                ServiceTypeId = baseRequestModel.ServiceTypeId ?? _ghnSettings.ServiceTypeId,
                ToDistrictId = baseRequestModel.ToDistrictId,
                ToWardCode = baseRequestModel.ToWardCode,
                Weight = baseRequestModel.Weight,
                Length = baseRequestModel.Length,
                Width = baseRequestModel.Width,
                Height = baseRequestModel.Height,
                InsuranceValue = baseRequestModel.InsuranceValue
            };

            var response = await _ghnShippingService.CalculateShippingFeeAsync(requestModel);
            if (response != null
                && successCodes.Contains(response.Code)
                && response.Data?.Total.HasValue == true
                && response.Data.Total.Value > 0)
            {
                var fee = Convert.ToDecimal(response.Data.Total.Value);
                return (true, fee, candidateServiceId, null);
            }

            lastErrorMessage = response?.Message ?? lastErrorMessage;
        }

        // Fallback: auto discover service for this route
        var availableServices = await _ghnShippingService.GetAvailableServicesAsync(
            baseRequestModel.FromDistrictId.Value,
            baseRequestModel.ToDistrictId,
            baseRequestModel.ServiceTypeId ?? _ghnSettings.ServiceTypeId,
            baseRequestModel.ShopId,
            baseRequestModel.TokenOverride);

        var firstAvailable = availableServices?.FirstOrDefault();
        if (firstAvailable != null)
        {
            var fallbackRequest = new GhnCalculateFeeRequest
            {
                ShopId = baseRequestModel.ShopId,
                TokenOverride = baseRequestModel.TokenOverride,
                FromDistrictId = baseRequestModel.FromDistrictId,
                FromWardCode = baseRequestModel.FromWardCode,
                ServiceId = firstAvailable.ServiceId,
                ServiceTypeId = firstAvailable.ServiceTypeId ?? baseRequestModel.ServiceTypeId ?? _ghnSettings.ServiceTypeId,
                ToDistrictId = baseRequestModel.ToDistrictId,
                ToWardCode = baseRequestModel.ToWardCode,
                Weight = baseRequestModel.Weight,
                Length = baseRequestModel.Length,
                Width = baseRequestModel.Width,
                Height = baseRequestModel.Height,
                InsuranceValue = baseRequestModel.InsuranceValue
            };

            var autoResponse = await _ghnShippingService.CalculateShippingFeeAsync(fallbackRequest);
            if (autoResponse != null
                && successCodes.Contains(autoResponse.Code)
                && autoResponse.Data?.Total.HasValue == true
                && autoResponse.Data.Total.Value > 0)
            {
                var fee = Convert.ToDecimal(autoResponse.Data.Total.Value);
                return (true, fee, firstAvailable.ServiceId, null);
            }

            lastErrorMessage = autoResponse?.Message ?? lastErrorMessage;
        }

        return (false, 0m, null, lastErrorMessage ?? "Khong the tinh phi giao hang.");
    }

    private async Task<(bool Success, List<OrderItemInput> Items, string? Message)> ResolveOrderItemsAsync(
        string userId,
        RequestCreateOrder request)
    {
        if (request.CartItems != null && request.CartItems.Count > 0)
        {
            var normalizedItems = request.CartItems
                .Where(item => !string.IsNullOrWhiteSpace(item.ProductId))
                .Select(item => new
                {
                    ProductId = item.ProductId!.Trim(),
                    Quantity = item.Quantity
                })
                .GroupBy(item => item.ProductId, StringComparer.OrdinalIgnoreCase)
                .Select(group => new
                {
                    ProductId = group.Key,
                    Quantity = group.Sum(x => x.Quantity)
                })
                .Where(x => x.Quantity > 0)
                .ToList();

            if (normalizedItems.Count == 0)
            {
                return (false, new List<OrderItemInput>(), "Cart items cannot be empty.");
            }

            var productIds = normalizedItems.Select(item => item.ProductId).ToList();
            var products = await _context.Products.GetProductsByIdsAsync(productIds);
            var lookup = products
                .Where(p => !string.IsNullOrWhiteSpace(p.Id))
                .ToDictionary(p => p.Id!.Trim(), StringComparer.OrdinalIgnoreCase);

            var missingProductIds = normalizedItems
                .Where(item => !lookup.ContainsKey(item.ProductId))
                .Select(item => item.ProductId)
                .ToList();

            if (missingProductIds.Count > 0)
            {
                return (false, new List<OrderItemInput>(), $"Product(s) not found: {string.Join(", ", missingProductIds)}");
            }

            var items = normalizedItems
                .Select(item =>
                {
                    var product = lookup[item.ProductId];
                    var unitPrice = Math.Max(product.Price, 0m);
                    return new OrderItemInput(product.Id!, item.Quantity, unitPrice, product);
                })
                .ToList();

            return (true, items, null);
        }

        var cart = await _context.Cart.GetCartByUserIdAsync(userId);
        if (cart == null)
        {
            return (false, new List<OrderItemInput>(), "Cart is empty.");
        }

        var cartItems = (await _context.CartItem.GetAllCartitemByCartIdAsync(cart.Id)).ToList();
        if (cartItems.Count == 0)
        {
            return (false, new List<OrderItemInput>(), "Cart is empty.");
        }

        var cartProductIds = cartItems
            .Where(item => !string.IsNullOrWhiteSpace(item.ProductId))
            .Select(item => item.ProductId!.Trim())
            .ToList();

        var cartProducts = await _context.Products.GetProductsByIdsAsync(cartProductIds);
        var cartProductLookup = cartProducts
            .Where(p => !string.IsNullOrWhiteSpace(p.Id))
            .ToDictionary(p => p.Id!.Trim(), StringComparer.OrdinalIgnoreCase);

        var itemsFromCart = cartItems
            .Where(item => !string.IsNullOrWhiteSpace(item.ProductId) && cartProductLookup.ContainsKey(item.ProductId!.Trim()))
            .Select(item =>
            {
                var productId = item.ProductId!.Trim();
                var product = cartProductLookup[productId];
                var quantity = item.Quantity ?? 0;
                var unitPrice = item.PriceAtAdd ?? product.Price;
                return new OrderItemInput(product.Id!, quantity, Math.Max(unitPrice, 0m), product);
            })
            .Where(info => info.Quantity > 0)
            .ToList();

        if (itemsFromCart.Count == 0)
        {
            return (false, new List<OrderItemInput>(), "Cart is empty.");
        }

        return (true, itemsFromCart, null);
    }

    private async Task<(bool Success, decimal Fee, int? ServiceIdUsed, string? Message)> CalculateShippingFeeAsync(
        RequestCreateOrder request,
        Address destination)
    {
        if (!destination.GhnDistrictId.HasValue || string.IsNullOrWhiteSpace(destination.GhnWardCode))
        {
            return (false, 0m, null, "Shipping address is missing GHN mapping data.");
        }

        return await PreviewSimpleShippingFeeAsync(
            destination.GhnDistrictId.Value,
            destination.GhnWardCode!,
            request.ShippingServiceId,
            request.ServiceTypeId);
    }

    private async Task<(bool Success, decimal Discount, Voucher? Voucher, string? Message)> ApplyVoucherAsync(
        string? userId,
        string? voucherCode,
        decimal orderAmount)
    {
        if (string.IsNullOrWhiteSpace(voucherCode))
        {
            return (true, 0m, null, null);
        }

        if (voucherCode.Contains(',', StringComparison.Ordinal))
        {
            return (false, 0m, null, "Chi duoc phep su dung mot voucher cho moi don hang.");
        }

        var voucher = await _context.Voucher.GetVoucherByCodeAsync(voucherCode.Trim());
        if (voucher == null)
        {
            return (false, 0m, null, "Voucher khong ton tai.");
        }

        var now = DateTime.UtcNow;
        if (now < voucher.StartDate || now > voucher.EndDate)
        {
            return (false, 0m, null, "Voucher chua den thoi gian ap dung hoac da het han.");
        }

        if (!voucher.IsActive)
        {
            return (false, 0m, null, "Voucher da bi khoa.");
        }

        if (!voucher.IsShared &&
            (!string.Equals(voucher.OwnerUserId, userId, StringComparison.OrdinalIgnoreCase)))
        {
            return (false, 0m, null, "Voucher nay chi danh rieng cho tai khoan cua ban.");
        }

        var source = voucher.Source;
        var isFestivalVoucher = !string.IsNullOrWhiteSpace(source) &&
            source.StartsWith($"{VoucherSources.Festival}:", StringComparison.OrdinalIgnoreCase);

        if (isFestivalVoucher)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return (false, 0m, null, "Ban can dang nhap de su dung voucher su kien.");
            }

            var festivalSource = source!;
            var hasUsedFestival = await _context.Order.HasUserUsedVoucherSourceAsync(userId, festivalSource);
            if (hasUsedFestival)
            {
                return (false, 0m, null, "Ban da su dung voucher su kien nay. Moi nguoi chi duoc dung 1 lan.");
            }
        }

        var remainingUses = voucher.UsageLimit.HasValue
            ? voucher.UsageLimit.Value - voucher.UsedCount
            : int.MaxValue;

        if (remainingUses <= 0)
        {
            return (false, 0m, null, "Voucher da het luot su dung.");
        }

        if (voucher.MinOrderAmount.HasValue && orderAmount < voucher.MinOrderAmount.Value)
        {
            return (false, 0m, null, "Don hang chua dat gia tri toi thieu cua voucher.");
        }

        decimal discount;
        if (string.Equals(voucher.DiscountType, "Percent", StringComparison.OrdinalIgnoreCase))
        {
            var percent = Math.Clamp(voucher.DiscountValue, 0m, 100m) / 100m;
            discount = orderAmount * percent;
            if (voucher.MaxDiscountAmount.HasValue && discount > voucher.MaxDiscountAmount.Value)
            {
                discount = voucher.MaxDiscountAmount.Value;
            }
        }
        else
        {
            discount = Math.Max(voucher.DiscountValue, 0m);
        }

        discount = Math.Min(discount, orderAmount);

        if (voucher.UsageLimit.HasValue)
        {
            var voucherId = voucher.VoucherId;
            var affected = await _context.ExecuteSqlInterpolatedAsync(
                $@"UPDATE Vouchers
                   SET UsedCount = UsedCount + 1,
                       IsActive = CASE WHEN UsedCount + 1 >= UsageLimit THEN 0 ELSE 1 END
                   WHERE VoucherId = {voucherId}
                     AND IsActive = 1
                     AND StartDate <= {now}
                     AND EndDate >= {now}
                     AND UsageLimit IS NOT NULL
                     AND UsedCount < UsageLimit");

            if (affected <= 0)
            {
                return (false, 0m, null, "Voucher da het luot su dung.");
            }
        }

        return (true, discount, voucher, null);
    }

    private sealed record OrderItemInput(string ProductId, int Quantity, decimal UnitPrice, Product Product);

    public async Task<string> CancelOrderAsync(string? userId, string orderId, RequestCancelOrder? request)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return "Cancel order failed!";
        }

        if (string.IsNullOrWhiteSpace(orderId))
        {
            return "OrderNumber id is required!";
        }

        var order = await _context.Order.GetAllOrderByNumberAsync(orderId);
        if (order == null || !string.Equals(order.CustomerId, userId, StringComparison.OrdinalIgnoreCase))
        {
            return "Order not found!";
        }

        if (string.Equals(order.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return "Order already cancelled!";
        }

        if (string.Equals(order.Status, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            return "Order already completed!";
        }

        var refundEligibility = false;
        var payments = await _context.Payments.GetByOrderIdAsync(order.Id);
        if (string.Equals(order.PaymentType, PaymentTypeVnpay, StringComparison.OrdinalIgnoreCase))
        {
            var paidPayment = payments?
                .Where(p => string.Equals(p.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(p => p.ProccessedAt)
                .FirstOrDefault();

            if (paidPayment != null)
            {
                var elapsed = DateTime.UtcNow - paidPayment.ProccessedAt;
                if (elapsed > TimeSpan.FromDays(2))
                {
                    return "Don hang da thanh toan VNPay chi duoc huy trong vong 2 ngay.";
                }

                refundEligibility = true;
            }
        }

        var shipments = await _context.Shipment.GetByOrdernumberAsync(order.OrderNumber);
        var artisanIds = await ResolveArtisanIdsAsync(order);
        var cancelledShipments = new List<Shipment>();
        foreach (var shipment in shipments)
        {
            if (!string.IsNullOrWhiteSpace(shipment.TrackingNumber) &&
                shipment.Provider.StartsWith("GHN", StringComparison.OrdinalIgnoreCase))
            {
                var cancelResult = await _ghnShippingService.CancelOrderAsync(
                    shipment.TrackingNumber,
                    order.OrderNumber,
                    request?.Reason);

                if (!cancelResult)
                {
                    _logger.LogWarning(
                        "Failed to cancel GHN shipment {TrackingNumber} for order {OrderId}.",
                        shipment.TrackingNumber,
                        order.Id);
                }
            }

            shipment.ShippingStatus = "cancelled";
            shipment.DeliveredAt = DateTime.UtcNow;
            await AddShipmentHistoryEntryAsync(shipment, "cancelled", request?.Reason ?? "Cancelled by user");
            cancelledShipments.Add(shipment);
        }

        order.Status = OrderStatuses.Cancelled;
        await RestoreOrderStockAsync(order);
        await ReleaseVoucherUsageAsync(order.VoucherId);
        await _context.SaveChangesAsync();
        var cancelledOrderItems = await EnsureOrderItemsLoadedAsync(order);
        await PublishInventoryRealtimeAsync(cancelledOrderItems, null);
        foreach (var shipment in cancelledShipments)
        {
            if (!string.IsNullOrWhiteSpace(order.CustomerId))
            {
                await _shipmentRealtimeService.BroadcastAsync(order.CustomerId, shipment, "Shipment cancelled");
            }

            foreach (var artisanId in artisanIds)
            {
                await _shipmentRealtimeService.BroadcastAsync(artisanId, shipment, "Shipment cancelled");
            }
        }

        var message = "Cancel order successfully!";
        if (refundEligibility && order.TotalAmount > 0)
        {
            var voucher = await _voucherService.CreateRefundVoucherAsync(userId, order, order.TotalAmount, request?.Reason);
            if (voucher != null)
            {
                message += $" Voucher {voucher.Code} da duoc them vao tai khoan ban.";
            }
        }

        await PublishOrderRealtimeAsync(order, message);
        return message;
    }

    public async Task<(bool Success, string Message)> ConfirmOrderReceivedAsync(string? userId, string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return (false, "User id is required.");
        }

        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return (false, "Order number is required.");
        }

        var order = await _context.Order.GetAllOrderByNumberAsync(orderNumber);
        if (order == null || !string.Equals(order.CustomerId, userId, StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Order not found!");
        }

        if (string.Equals(order.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Order already cancelled!");
        }

        if (string.Equals(order.Status, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Order already completed!");
        }

        var eligibleStatuses = new[] { OrderStatuses.Shipping, OrderStatuses.Paid };
        var canConfirm = eligibleStatuses.Any(status =>
            string.Equals(order.Status, status, StringComparison.OrdinalIgnoreCase));

        if (!canConfirm)
        {
            return (false, "Only orders in Shipping or Paid status can be confirmed as received.");
        }

        var shipments = await _context.Shipment.GetByOrderIdAsync(order.Id) ?? new List<Shipment>();
        var updatedShipments = new List<Shipment>();
        foreach (var shipment in shipments)
        {
            shipment.ShippingStatus = "delivered";
            shipment.DeliveredAt ??= DateTime.UtcNow;
            await AddShipmentHistoryEntryAsync(shipment, "delivered", "Confirmed received by customer");
            updatedShipments.Add(shipment);
        }

        order.Status = OrderStatuses.Completed;
        await _context.SaveChangesAsync();

        var artisanIds = await ResolveArtisanIdsAsync(order);
        if (!string.IsNullOrWhiteSpace(order.CustomerId))
        {
            foreach (var shipment in updatedShipments)
            {
                await _shipmentRealtimeService.BroadcastAsync(order.CustomerId, shipment, "Shipment delivered (confirmed by customer)");
            }
        }

        foreach (var shipment in updatedShipments)
        {
            foreach (var artisanId in artisanIds)
            {
                await _shipmentRealtimeService.BroadcastAsync(artisanId, shipment, "Shipment delivered (confirmed by customer)");
            }
        }

        await PublishOrderRealtimeAsync(order, "Order marked as completed");
        return (true, "Confirm received successfully!");
    }

    public async Task<(bool Success, string Message)> ConfirmOrderByArtisanAsync(string? artisanId, string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(artisanId))
        {
            return (false, "Artisan id is required.");
        }

        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return (false, "Order number is required.");
        }

        var order = await _context.Order.GetAllOrderByNumberAsync(orderNumber);
        if (order == null)
        {
            return (false, "Order not found!");
        }

        if (string.Equals(order.Status, OrderStatuses.Cancelled, StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Order already cancelled.");
        }

        if (string.Equals(order.Status, OrderStatuses.Completed, StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Order already completed.");
        }

        var artisanMatch = await DoesOrderBelongToArtisanAsync(order, artisanId);
        if (!artisanMatch)
        {
            return (false, "You are not authorized to update this order.");
        }

        if (order.ArtisanConfirmedAt.HasValue)
        {
            return (true, "Order already confirmed.");
        }

        order.ArtisanConfirmedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await PublishOrderRealtimeAsync(order, "Order confirmed by artisan");
        return (true, "Order confirmed successfully.");
    }

    public async Task<(bool Success, string Message)> MarkOrderAsShippingByArtisanAsync(string? artisanId, string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(artisanId))
        {
            return (false, "Artisan id is required.");
        }

        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return (false, "Order number is required.");
        }

        var order = await _context.Order.GetAllOrderByNumberAsync(orderNumber);
        if (order == null)
        {
            return (false, "Order not found!");
        }

        if (string.Equals(order.Status, OrderStatuses.Cancelled, StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Order already cancelled.");
        }

        if (string.Equals(order.Status, OrderStatuses.Completed, StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Order already completed.");
        }

        if (string.Equals(order.Status, OrderStatuses.Shipping, StringComparison.OrdinalIgnoreCase))
        {
            return (true, "Order already in shipping status.");
        }

        var orderItems = await EnsureOrderItemsLoadedAsync(order);
        if (orderItems == null || orderItems.Count == 0)
        {
            return (false, "Order has no items.");
        }

        var productIds = orderItems
            .Where(item => !string.IsNullOrWhiteSpace(item.ProductID))
            .Select(item => item.ProductID!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (productIds.Count == 0)
        {
            return (false, "Order items missing product references.");
        }

        var products = await _context.Products.GetProductsByIdsAsync(productIds);
        if (products.Count != productIds.Count)
        {
            return (false, "Order items are invalid or no longer available.");
        }

        var mismatchedProduct = products.FirstOrDefault(product =>
            string.IsNullOrWhiteSpace(product.ArtisanId) ||
            !string.Equals(product.ArtisanId, artisanId, StringComparison.OrdinalIgnoreCase));

        if (mismatchedProduct != null)
        {
            return (false, "You are not authorized to update this order.");
        }

        if (!string.Equals(order.Status, OrderStatuses.WaitingForPickup, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(order.Status, OrderStatuses.Paid, StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Only orders waiting for pickup or already paid can be marked as shipping.");
        }

        order.Status = OrderStatuses.Shipping;
        order.ArtisanConfirmedAt ??= DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await PublishOrderRealtimeAsync(order, "Order marked as shipping");
        return (true, "Order marked as shipping.");
    }

    public async Task<int> CancelUnconfirmedOrdersAsync(TimeSpan maxAge, CancellationToken cancellationToken)
    {
        var window = maxAge <= TimeSpan.Zero ? TimeSpan.FromHours(24) : maxAge;
        var threshold = DateTime.UtcNow.Subtract(window);
        var candidates = await _context.Order.GetUnconfirmedOrdersBeforeAsync(threshold);
        if (candidates == null || candidates.Count == 0)
        {
            return 0;
        }

        var cancelled = 0;
        foreach (var order in candidates)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                break;
            }

            var success = await AutoCancelOrderAsync(order, cancellationToken);
            if (success)
            {
                cancelled++;
            }
        }

        return cancelled;
    }

    private async Task<bool> AutoCancelOrderAsync(Order order, CancellationToken cancellationToken)
    {
        var trackedOrder = await _context.Order.GetAllOrderByIdAsync(order.Id);
        if (trackedOrder == null)
        {
            return false;
        }

        if (trackedOrder.ArtisanConfirmedAt.HasValue ||
            string.Equals(trackedOrder.Status, OrderStatuses.Cancelled, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(trackedOrder.Status, OrderStatuses.Completed, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(trackedOrder.Status, OrderStatuses.Shipping, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var artisanId = await ResolveArtisanIdAsync(trackedOrder);
        if (string.IsNullOrWhiteSpace(artisanId))
        {
            _logger.LogWarning("Unable to resolve artisan for order {OrderId} during auto-cancel.", trackedOrder.Id);
            return false;
        }

        var shipments = trackedOrder.Shipments ?? await _context.Shipment.GetByOrderIdAsync(trackedOrder.Id) ?? new List<Shipment>();
        var cancelledShipments = new List<Shipment>();

        foreach (var shipment in shipments)
        {
            if (!string.IsNullOrWhiteSpace(shipment.TrackingNumber) &&
                shipment.Provider.StartsWith("GHN", StringComparison.OrdinalIgnoreCase))
            {
                var cancelled = await _ghnShippingService.CancelOrderAsync(
                    shipment.TrackingNumber,
                    trackedOrder.OrderNumber,
                    "Auto-cancel: seller did not confirm order within 24h");

                if (!cancelled)
                {
                    _logger.LogWarning(
                        "Failed to cancel GHN shipment {TrackingNumber} for order {OrderId} (auto-cancel).",
                        shipment.TrackingNumber,
                        trackedOrder.Id);
                }
            }

            shipment.ShippingStatus = "cancelled";
            shipment.DeliveredAt = DateTime.UtcNow;
            await AddShipmentHistoryEntryAsync(shipment, "cancelled", "Auto-cancelled after seller inactivity");
            cancelledShipments.Add(shipment);
        }

        trackedOrder.Status = OrderStatuses.Cancelled;
        await RestoreOrderStockAsync(trackedOrder);
        await ReleaseVoucherUsageAsync(trackedOrder.VoucherId);
        await _context.SaveChangesAsync();
        var autoCancelledItems = await EnsureOrderItemsLoadedAsync(trackedOrder);
        await PublishInventoryRealtimeAsync(autoCancelledItems, null);

        foreach (var shipment in cancelledShipments)
        {
            if (!string.IsNullOrWhiteSpace(trackedOrder.CustomerId))
            {
                await _shipmentRealtimeService.BroadcastAsync(trackedOrder.CustomerId, shipment, "Shipment cancelled");
            }

            if (!string.IsNullOrWhiteSpace(artisanId))
            {
                await _shipmentRealtimeService.BroadcastAsync(artisanId, shipment, "Shipment cancelled");
            }
        }

        await HandleAutoCancelNotificationsAndCompensationAsync(trackedOrder, artisanId, cancellationToken);
        await PublishOrderRealtimeAsync(trackedOrder, "Order auto cancelled");
        return true;
    }

    private async Task HandleAutoCancelNotificationsAndCompensationAsync(Order order, string artisanId, CancellationToken cancellationToken)
    {
        var artisanUser = !string.IsNullOrWhiteSpace(artisanId)
            ? await _context.Users.GetByIdAsync(artisanId)
            : null;
        var shopName = artisanUser?.ShopName ?? artisanUser?.DisplayName ?? "cua hang";

        var customerMessage = $"Don hang {order.OrderNumber} cua ban da bi {shopName} huy do khong xac nhan trong 24h.";
        if (!string.IsNullOrWhiteSpace(order.CustomerId))
        {
            await _notificationService.NotifySimpleAsync(order.CustomerId, NotificationTypes.OrderAutoCancelled, customerMessage);
        }

        if (!string.IsNullOrWhiteSpace(artisanId))
        {
            var artisanMessage = $"Don {order.OrderNumber} bi huy do khong xac nhan trong 24h.";
            await _notificationService.NotifySimpleAsync(artisanId, NotificationTypes.OrderAutoCancelled, artisanMessage);
        }

        if (string.Equals(order.PaymentType, PaymentTypeVnpay, StringComparison.OrdinalIgnoreCase) && order.TotalAmount > 0)
        {
            var payments = await _context.Payments.GetByOrderIdAsync(order.Id);
            var isPaid = payments?.Any(p => string.Equals(p.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase)) == true;

            if (isPaid && !string.IsNullOrWhiteSpace(order.CustomerId))
            {
                await _voucherService.CreateRefundVoucherAsync(order.CustomerId, order, order.TotalAmount, "Seller did not confirm order");
            }
        }

        if (!string.IsNullOrWhiteSpace(artisanId))
        {
            var penaltyResult = await _sellerReputationService.ApplyMissedConfirmationPenaltyAsync(artisanId, order, cancellationToken);
            var penaltyMessage = $"Ban bi tru {SellerPenaltyPoints} diem uy tin do khong xac nhan don {order.OrderNumber}. Diem hien tai: {penaltyResult.NewScore}.";
            if (penaltyResult.LockedAccount)
            {
                penaltyMessage += " Tai khoan cua ban da bi khoa.";
            }

            await _notificationService.NotifySimpleAsync(artisanId, NotificationTypes.SellerReputationPenalty, penaltyMessage);
        }
    }

    public async Task<bool> CreateShipmentsAfterPaymentAsync(string orderId)
    {
        if (string.IsNullOrWhiteSpace(orderId))
        {
            return false;
        }

        try
        {
            var order = await _context.Order.GetAllOrderByIdAsync(orderId);
            if (order == null)
            {
                return false;
            }

            var existingShipments = await _context.Shipment.GetByOrderIdAsync(order.Id);
            if (existingShipments != null && existingShipments.Any())
            {
                return true;
            }

            var shippingAddress = await _context.Address.GetAddressByIdAsync(order.ShipingAddressId);
            var customer = await _context.Users.GetByIdAsync(order.CustomerId);
            var orderItems = await _context.OrderDetail.GetAllOrderItemAsync(order.Id);

            if (shippingAddress == null || customer == null || orderItems == null || orderItems.Count == 0)
            {
                _logger.LogWarning("Insufficient data to create shipments for order {OrderId}.", order.Id);
                return false;
            }

            var baseOptions = BuildBaseShipmentOptions(shippingAddress, customer, order);
            var shipmentResult = await TryCreateGhnShipmentsAsync(order, orderItems, shippingAddress, customer, baseOptions);
            return shipmentResult.AnyShipmentsCreated;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create shipments after payment for order {OrderId}.", orderId);
            return false;
        }
    }

    public async Task<ResponseDTOOrder?> GetOrderByIdAsync(string orderId)
    {

        var order = await _context.Order.GetAllOrderByNumberAsync(orderId);
        if (order == null)
        {
            return null;
        }

        var orderDetail = _mapper.Map<ResponseDTOOrder>(order);

        return orderDetail;
    }

    public async Task<PagedResult<ResponseDTOOrder>> GetAllOrderByUserIdAsync(string? userId, RequestFilterOrder? requestFilter)
    {
        var pageIndex = requestFilter?.PageIndex ?? 1;
        var pageSize = requestFilter?.PageSize ?? 10;
        pageIndex = pageIndex < 1 ? 1 : pageIndex;
        pageSize = pageSize < 1 ? 10 : pageSize;

        if (string.IsNullOrWhiteSpace(userId))
        {
            return new PagedResult<ResponseDTOOrder>
            {
                Items = Enumerable.Empty<ResponseDTOOrder>(),
                TotalCount = 0,
                PageIndex = pageIndex,
                PageSize = pageSize
            };
        }

        var orders = await _context.Order.GetAllOrderByUserIdAsync(userId);
        var filteredOrders = orders.AsEnumerable();

        if (requestFilter != null)
        {
            if (!string.IsNullOrWhiteSpace(requestFilter.search))
            {
                filteredOrders = filteredOrders.Where(o =>
                    o.OrderNumber != null &&
                    o.OrderNumber.Contains(requestFilter.search, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(requestFilter.Status))
            {
                filteredOrders = filteredOrders.Where(o =>
                    o.Status != null &&
                    string.Equals(o.Status, requestFilter.Status, StringComparison.OrdinalIgnoreCase));
            }
        }

        filteredOrders = filteredOrders.OrderByDescending(o => o.CreateAt);
        var totalCount = filteredOrders.Count();
        var pagedOrders = filteredOrders
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new PagedResult<ResponseDTOOrder>
        {
            Items = _mapper.Map<IEnumerable<ResponseDTOOrder>>(pagedOrders),
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult<ResponseDTOOrder>> GetOrdersPagedAsync(int pageIndex, int pageSize, string? paymentStatus)
    {
        if (pageIndex < 1)
        {
            pageIndex = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 10;
        }

        var (orders, totalCount) = await _context.Order.GetPagedOrdersAsync(pageIndex, pageSize, paymentStatus);
        var mapped = _mapper.Map<IEnumerable<ResponseDTOOrder>>(orders);

        return new PagedResult<ResponseDTOOrder>
        {
            Items = mapped,
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    private async Task NotifyOrderActorsAsync(Order order, List<OrderItem> orderItems)
    {
        try
        {
            var products = await _context.Products.GetProductsByIdsAsync(orderItems.Select(item => item.ProductID));
            var productLookup = products
                .Where(p => !string.IsNullOrWhiteSpace(p.Id))
                .ToDictionary(p => p.Id, p => p);

            await _notificationService.NotifyOrderCreatedAsync(order, orderItems, productLookup);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notifications for order {OrderId}.", order.Id);
        }
    }

    private async Task<ShipmentCreationResult> TryCreateGhnShipmentsAsync(
        Order order,
        List<OrderItem> orderItems,
        Address shippingAddress,
        User customer,
        GhnShipmentOptions? baseOptions = null)
    {
        var createdShipments = new List<Shipment>();
        var responses = new List<GhnCreateOrderResponse?>();
        var anyShipmentCreated = false;

        try
        {
            baseOptions ??= BuildBaseShipmentOptions(shippingAddress, customer, order);
            if (baseOptions?.ToDistrictId == null || string.IsNullOrWhiteSpace(baseOptions.ToWardCode))
            {
                _logger.LogWarning("Missing GHN destination data for order {OrderId}. Skipping shipment creation.", order.Id);
                return new ShipmentCreationResult(false, createdShipments, responses);
            }
            var productIds = orderItems
                .Select(item => item.ProductID)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();

            var products = await _context.Products.GetProductsByIdsAsync(productIds);
            var productLookup = products
                .Where(p => !string.IsNullOrWhiteSpace(p.Id))
                .ToDictionary(p => p.Id!, p => p);
            var shippingProfiles = products
                .Where(p => !string.IsNullOrWhiteSpace(p.Id) && p.ShippingProfile != null)
                .ToDictionary(p => p.Id!, p => p.ShippingProfile!);
            var sellerGroups = orderItems
                .GroupBy(item =>
                {
                    if (!string.IsNullOrWhiteSpace(item.ProductID) &&
                        productLookup.TryGetValue(item.ProductID, out var product) &&
                        !string.IsNullOrWhiteSpace(product.ArtisanId))
                    {
                        return product.ArtisanId!;
                    }

                    return PlatformSellerId;
                })
                .ToList();

            foreach (var group in sellerGroups)
            {
                var sellerId = group.Key;
                User? seller = null;
                Address? pickupAddress = null;
                SellerShippingProfile? sellerProfile = null;
                if (sellerId != PlatformSellerId)
                {
                    seller = await _context.Users.GetByIdAsync(sellerId);
                    if (seller == null)
                    {
                        _logger.LogWarning("Seller {SellerId} not found when creating shipments for order {OrderId}.", sellerId, order.Id);
                        continue;
                    }

                    sellerProfile = await _context.SellerShippingProfiles.GetBySellerIdAsync(sellerId);
                    if (sellerProfile == null)
                    {
                        pickupAddress = await GetSellerPickupAddressAsync(sellerId);
                        if (pickupAddress == null)
                        {
                            _logger.LogWarning("Seller {SellerId} has no pickup info. Skipping shipment for order {OrderId}.", sellerId, order.Id);
                            continue;
                        }
                    }
                }

                var sellerOptions = sellerId == PlatformSellerId
                    ? BuildPlatformShipmentOptions(baseOptions, group, shippingProfiles)
                    : BuildSellerShipmentOptions(baseOptions, pickupAddress, seller!, sellerProfile, group, shippingProfiles);

                var sellerProducts = group
                    .Select(item =>
                        !string.IsNullOrWhiteSpace(item.ProductID) && productLookup.TryGetValue(item.ProductID, out var product)
                            ? product
                            : null)
                    .Where(p => p != null)
                    .Cast<Product>()
                    .ToList();

                if (sellerProducts.Count == 0)
                {
                    _logger.LogWarning("No products found for seller {SellerId} when creating shipment for order {OrderId}.", sellerId, order.Id);
                    continue;
                }

                var sellerItems = group.ToList();
                var response = await _ghnShippingService.CreateShippingOrderAsync(
                    order,
                    sellerItems,
                    shippingAddress,
                    customer,
                    sellerOptions,
                    sellerProducts);
                responses.Add(response);

                if (response?.Data?.OrderCode == null)
                {
                    _logger.LogWarning("GHN did not return an order code for seller {SellerId} in order {OrderId}.", sellerId, order.Id);
                    continue;
                }

                var shipment = new Shipment
                {
                    Id = $"Shipment-{sellerId}-{Guid.NewGuid():N}",
                    OrderID = order.Id,
                    Provider = "GHN-TEST",
                    TrackingNumber = response.Data.OrderCode,
                    ShippingStatus = response.Data.Status ?? "ready_to_pick",
                    ShippedAt = DateTime.UtcNow
                };

                await _context.Shipment.AddAsync(shipment);
                await AddShipmentHistoryEntryAsync(shipment, "created", "Shipment created");
                createdShipments.Add(shipment);
                anyShipmentCreated = true;
            }

            if (anyShipmentCreated)
            {
                await _context.SaveChangesAsync();
                foreach (var shipment in createdShipments)
                {
                    await _shipmentRealtimeService.BroadcastAsync(order.CustomerId, shipment, "Shipment created");
                }
                await PublishOrderRealtimeAsync(order, "Shipment created");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create GHN shipments for order {OrderId}.", order.Id);
        }

        return new ShipmentCreationResult(anyShipmentCreated, createdShipments, responses);
    }

    private sealed record ShipmentCreationResult(
        bool AnyShipmentsCreated,
        List<Shipment> Shipments,
        List<GhnCreateOrderResponse?> ProviderResponses);

    private async Task<Address?> CreateOrderShippingAddressAsync(string userId, Address sourceAddress)
    {
        var address = new Address
        {
            Id = $"ADDR-ORDER-{Guid.NewGuid():N}",
            UserID = userId,
            Line1 = sourceAddress.Line1,
            Line2 = sourceAddress.Line2,
            City = sourceAddress.City ?? "Unknown",
            Country = string.IsNullOrWhiteSpace(sourceAddress.Country) ? "Vietnam" : sourceAddress.Country!,
            IsDefault = false,
            ContactName = sourceAddress.ContactName,
            ContactPhone = sourceAddress.ContactPhone,
            GhnProvinceId = sourceAddress.GhnProvinceId,
            GhnDistrictId = sourceAddress.GhnDistrictId,
            GhnWardCode = sourceAddress.GhnWardCode
        };

        var result = await _context.Address.CreateAddressAsync(address, null);
        if (!result.Contains("success", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Failed to persist shipping address for user {UserId}: {Message}", userId, result);
            return null;
        }

        return address;
    }

    private static string? NormalizePaymentType(string? paymentType)
    {
        if (string.Equals(paymentType, PaymentTypeVnpay, StringComparison.OrdinalIgnoreCase))
        {
            return PaymentTypeVnpay;
        }

        if (string.Equals(paymentType, PaymentTypeCod, StringComparison.OrdinalIgnoreCase))
        {
            return PaymentTypeCod;
        }

        return null;
    }

    private int? ResolvePreferredServiceId(int orderServiceId)
    {
        if (orderServiceId > 0)
        {
            return orderServiceId;
        }

        if (orderServiceId == -1)
        {
            return null;
        }

        return _ghnSettings.ServiceId;
    }

    private GhnShipmentOptions BuildBaseShipmentOptions(Address shippingAddress, User customer, Order order)
    {
        return new GhnShipmentOptions
        {
            ReceiverName = shippingAddress.ContactName ?? customer.DisplayName ?? customer.Username ?? customer.Email,
            ReceiverPhone = shippingAddress.ContactPhone ?? customer.PhoneNumber ?? _ghnSettings.FallbackReceiverPhone ?? _ghnSettings.FromPhone,
            ToDistrictId = shippingAddress.GhnDistrictId ?? _ghnSettings.DefaultToDistrictId,
            ToWardCode = shippingAddress.GhnWardCode ?? _ghnSettings.DefaultToWardCode,
            ToAddress = BuildFullAddress(shippingAddress),
            ToProvinceName = shippingAddress.City,
            PaymentType = string.IsNullOrWhiteSpace(order.PaymentType) ? PaymentTypeCod : order.PaymentType,
            PaymentTypeId = order.ShippingPaymentTypeId > 0 ? order.ShippingPaymentTypeId : _ghnSettings.PaymentTypeId,
            ServiceId = ResolvePreferredServiceId(order.ShippingServiceId),
            ServiceTypeId = order.ShippingServiceTypeId > 0 ? order.ShippingServiceTypeId : _ghnSettings.ServiceTypeId,
            RequiredNote = string.IsNullOrWhiteSpace(order.ShippingRequiredNote) ? _ghnSettings.RequiredNote : order.ShippingRequiredNote
        };
    }

    private GhnShipmentOptions BuildSellerShipmentOptions(
        GhnShipmentOptions baseOptions,
        Address? fallbackPickupAddress,
        User seller,
        SellerShippingProfile? sellerProfile,
        IEnumerable<OrderItem> sellerItems,
        IReadOnlyDictionary<string, ProductShippingProfile> shippingProfiles)
    {
        var pickupAddressLine = sellerProfile?.PickupAddressLine
            ?? (fallbackPickupAddress != null ? BuildFullAddress(fallbackPickupAddress) : null)
            ?? _ghnSettings.FromAddress;

        var fromDistrict = sellerProfile?.PickupDistrictId
            ?? fallbackPickupAddress?.GhnDistrictId
            ?? _ghnSettings.FromDistrictId;

        var fromWard = sellerProfile?.PickupWardCode
            ?? fallbackPickupAddress?.GhnWardCode
            ?? _ghnSettings.FromWardCode;

        var options = new GhnShipmentOptions
        {
            ReceiverName = baseOptions.ReceiverName,
            ReceiverPhone = baseOptions.ReceiverPhone,
            ToDistrictId = baseOptions.ToDistrictId,
            ToWardCode = baseOptions.ToWardCode,
            ToAddress = baseOptions.ToAddress,
            ToProvinceName = baseOptions.ToProvinceName,
            ItemWeights = baseOptions.ItemWeights,
            PaymentType = baseOptions.PaymentType,
            PaymentTypeId = baseOptions.PaymentTypeId,
            ServiceId = baseOptions.ServiceId,
            ServiceTypeId = baseOptions.ServiceTypeId,
            RequiredNote = baseOptions.RequiredNote,
            FromName = sellerProfile?.PickupContactName ?? seller.ShopName ?? seller.DisplayName ?? seller.Username,
            FromPhone = sellerProfile?.PickupContactPhone ?? seller.PhoneNumber ?? _ghnSettings.FromPhone,
            FromAddress = pickupAddressLine,
            FromDistrictId = fromDistrict,
            FromWardCode = fromWard,
            TokenOverride = string.IsNullOrWhiteSpace(sellerProfile?.GhnToken) ? null : sellerProfile.GhnToken,
            ShopIdOverride = sellerProfile?.GhnShopId
        };

        options.Weight = CalculateTotalWeight(sellerItems, options.ItemWeights, shippingProfiles);
        options.Length = ResolveDimension(sellerItems, baseOptions.Length, shippingProfiles, p => p.LengthCm, _ghnSettings.DefaultParcelLength);
        options.Width = ResolveDimension(sellerItems, baseOptions.Width, shippingProfiles, p => p.WidthCm, _ghnSettings.DefaultParcelWidth);
        options.Height = ResolveDimension(sellerItems, baseOptions.Height, shippingProfiles, p => p.HeightCm, _ghnSettings.DefaultParcelHeight);
        var sellerSubtotal = CalculateSubtotal(sellerItems);
        var collectCod = !string.Equals(baseOptions.PaymentType, PaymentTypeVnpay, StringComparison.OrdinalIgnoreCase);
        options.CodAmount = collectCod ? sellerSubtotal : 0m;
        options.InsuranceValue = sellerSubtotal;
        return options;
    }

    private GhnShipmentOptions BuildPlatformShipmentOptions(
        GhnShipmentOptions baseOptions,
        IEnumerable<OrderItem> sellerItems,
        IReadOnlyDictionary<string, ProductShippingProfile> shippingProfiles)
    {
        var options = new GhnShipmentOptions
        {
            ReceiverName = baseOptions.ReceiverName,
            ReceiverPhone = baseOptions.ReceiverPhone,
            ToDistrictId = baseOptions.ToDistrictId,
            ToWardCode = baseOptions.ToWardCode,
            ToAddress = baseOptions.ToAddress,
            ToProvinceName = baseOptions.ToProvinceName,
            Length = baseOptions.Length,
            Width = baseOptions.Width,
            Height = baseOptions.Height,
            ItemWeights = baseOptions.ItemWeights,
            PaymentType = baseOptions.PaymentType,
            PaymentTypeId = baseOptions.PaymentTypeId,
            ServiceId = baseOptions.ServiceId,
            ServiceTypeId = baseOptions.ServiceTypeId,
            RequiredNote = baseOptions.RequiredNote,
            FromName = _ghnSettings.FromName,
            FromPhone = _ghnSettings.FromPhone,
            FromAddress = _ghnSettings.FromAddress,
            FromDistrictId = _ghnSettings.FromDistrictId,
            FromWardCode = _ghnSettings.FromWardCode
        };

        options.Weight = CalculateTotalWeight(sellerItems, options.ItemWeights, shippingProfiles);
        options.Length = ResolveDimension(sellerItems, baseOptions.Length, shippingProfiles, p => p.LengthCm, _ghnSettings.DefaultParcelLength);
        options.Width = ResolveDimension(sellerItems, baseOptions.Width, shippingProfiles, p => p.WidthCm, _ghnSettings.DefaultParcelWidth);
        options.Height = ResolveDimension(sellerItems, baseOptions.Height, shippingProfiles, p => p.HeightCm, _ghnSettings.DefaultParcelHeight);
        var subtotal = CalculateSubtotal(sellerItems);
        var collectCod = !string.Equals(baseOptions.PaymentType, PaymentTypeVnpay, StringComparison.OrdinalIgnoreCase);
        options.CodAmount = collectCod ? subtotal : 0m;
        options.InsuranceValue = subtotal;
        return options;
    }

    private static decimal CalculateSubtotal(IEnumerable<OrderItem> items)
    {
        decimal total = 0m;
        foreach (var item in items)
        {
            var quantity = item.Quantity > 0 ? item.Quantity : 1;
            total += item.UnitPrice * quantity;
        }

        return total;
    }

    private int CalculateTotalWeight(
        IEnumerable<OrderItem> items,
        Dictionary<string, int>? itemWeights,
        IReadOnlyDictionary<string, ProductShippingProfile> shippingProfiles)
    {
        var defaultWeight = Math.Max(_ghnSettings.DefaultItemWeight, 100);
        var total = 0;

        foreach (var item in items)
        {
            var unitWeight = defaultWeight;
            if (!string.IsNullOrWhiteSpace(item.ProductID) &&
                itemWeights != null &&
                itemWeights.TryGetValue(item.ProductID, out var overrideWeight) &&
                overrideWeight > 0)
            {
                unitWeight = overrideWeight;
            }
            else if (!string.IsNullOrWhiteSpace(item.ProductID) &&
                     shippingProfiles.TryGetValue(item.ProductID, out var profile) &&
                     profile.WeightGram.HasValue &&
                     profile.WeightGram.Value > 0)
            {
                unitWeight = profile.WeightGram.Value;
            }

            var quantity = item.Quantity > 0 ? item.Quantity : 1;
            total += unitWeight * quantity;
        }

        return Math.Max(total, defaultWeight);
    }

    private int ResolveDimension(
        IEnumerable<OrderItem> items,
        int? requestedValue,
        IReadOnlyDictionary<string, ProductShippingProfile> shippingProfiles,
        Func<ProductShippingProfile, int?> selector,
        int defaultValue)
    {
        if (requestedValue.HasValue && requestedValue.Value > 0)
        {
            return requestedValue.Value;
        }

        foreach (var item in items)
        {
            if (!string.IsNullOrWhiteSpace(item.ProductID) &&
                shippingProfiles.TryGetValue(item.ProductID, out var profile))
            {
                var value = selector(profile);
                if (value.HasValue && value.Value > 0)
                {
                    return value.Value;
                }
            }
        }

        return defaultValue;
    }

    private Task AddShipmentHistoryEntryAsync(Shipment shipment, string status, string? note)
    {
        var history = new ShipmentHistory
        {
            Id = $"SHH-{Guid.NewGuid():N}",
            ShipmentId = shipment.Id,
            Status = status,
            Note = note,
            CreatedAt = DateTime.UtcNow
        };

        return _context.ShipmentHistory.AddAsync(history);
    }

    private static string BuildFullAddress(Address address)
    {
        var segments = new List<string>();
        if (!string.IsNullOrWhiteSpace(address.Line1))
        {
            segments.Add(address.Line1!);
        }
        if (!string.IsNullOrWhiteSpace(address.Line2))
        {
            segments.Add(address.Line2!);
        }
        if (!string.IsNullOrWhiteSpace(address.City))
        {
            segments.Add(address.City);
        }
        if (!string.IsNullOrWhiteSpace(address.Country))
        {
            segments.Add(address.Country);
        }

        return string.Join(", ", segments);
    }

    private async Task<Address?> GetSellerPickupAddressAsync(string sellerId)
    {
        var addresses = await _context.Address.GetAllAddressByUserIdAsync(sellerId) ?? Enumerable.Empty<Address>();
        var ordered = addresses
            .OrderByDescending(a => a.IsDefault)
            .ThenBy(a => a.Id)
            .ToList();
        return ordered.FirstOrDefault();
    }

    private async Task<string?> ResolveArtisanIdAsync(Order order)
    {
        var artisanIds = await ResolveArtisanIdsAsync(order);
        return artisanIds.Count == 1 ? artisanIds[0] : null;
    }

    private async Task<List<string>> ResolveArtisanIdsAsync(Order order)
    {
        var orderItems = await EnsureOrderItemsLoadedAsync(order);
        if (orderItems == null || orderItems.Count == 0)
        {
            return new List<string>();
        }

        var productIds = orderItems
            .Where(item => !string.IsNullOrWhiteSpace(item.ProductID))
            .Select(item => item.ProductID!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (productIds.Count == 0)
        {
            return new List<string>();
        }

        var products = await _context.Products.GetProductsByIdsAsync(productIds);
        return products
            .Where(p => !string.IsNullOrWhiteSpace(p.ArtisanId))
            .Select(p => p.ArtisanId!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private async Task<bool> DoesOrderBelongToArtisanAsync(Order order, string artisanId)
    {
        var resolved = await ResolveArtisanIdAsync(order);
        return !string.IsNullOrWhiteSpace(resolved) &&
               string.Equals(resolved, artisanId, StringComparison.OrdinalIgnoreCase);
    }

    public async Task<Order?> GetOrderByNumberForUserAsync(string? userId, string? orderNumber)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(orderNumber))
        {
            return null;
        }

        var order = await _context.Order.GetAllOrderByNumberAsync(orderNumber.Trim());
        if (order == null)
        {
            return null;
        }

        return string.Equals(order.CustomerId, userId, StringComparison.OrdinalIgnoreCase) ? order : null;
    }

    public async Task<IEnumerable<ResponseDTOOrder>> GetNewestOrderAsync(string userId)
    {
        var orders = await _context.Order.GetAllOrderByArtisanIdAsync(userId);

        orders = orders.OrderByDescending(o => o.CreateAt).Take(10);

        var mapped = _mapper.Map<IEnumerable<ResponseDTOOrder>>(orders);
        return mapped;
    }

    public async Task<IEnumerable<ResponseDTOMonthRevenuePercentage>> GetAdminRevenuePrecentageInMonthAsync(int? year, int? month)
    {
        var orders = await _context.Order.GetAllOrderWithProductCategoryAsync();

        var ordersInMonth = orders
       .Where(o => o.CreateAt.Year == year && o.CreateAt.Month == month && (o.Status.Equals("Completed") || o.Status.Equals("Paid")))
       .ToList();

        var allOrderItems = ordersInMonth
            .SelectMany(o => o.OrderItems)
            .ToList();

        var totalRevenue = allOrderItems
            .Sum(oi => oi.UnitPrice * oi.Quantity);

        if (totalRevenue == 0)
            return new List<ResponseDTOMonthRevenuePercentage>();

        var revenueByCategory = allOrderItems
        .GroupBy(oi => new
        {
            CategoryId = oi.Product.CategoryNav.Id,
            CategoryName = oi.Product.CategoryNav.Name
        })
        .Select(g => new ResponseDTOMonthRevenuePercentage
        {
            CategoryId = g.Key.CategoryId,
            CategoryName = g.Key.CategoryName,
            Revenue = g.Sum(x => x.UnitPrice * x.Quantity),
            Percentage = Math.Round((g.Sum(x => x.UnitPrice * x.Quantity) / totalRevenue) * 100, 2)
        })
        .OrderByDescending(x => x.Revenue)
        .ToList();

        return revenueByCategory;
    }
    public async Task<IEnumerable<ResponseDTOMonthRevenuePercentage>> GetArtisanRevenuePrecentageInMonthAsync(string? userId, int? year, int? month)
    {
        var orders = await _context.Order.GetAllOrderByArtisanIdAsync(userId);

        var ordersInMonth = orders
       .Where(o => o.CreateAt.Year == year && o.CreateAt.Month == month && (o.Status.Equals("Completed") || o.Status.Equals("Paid")))
       .ToList();

        var allOrderItems = ordersInMonth
            .SelectMany(o => o.OrderItems)
            .Where(oi => oi.Product.ArtisanId == userId)
            .ToList();

        var totalRevenue = allOrderItems
            .Sum(oi => oi.UnitPrice * oi.Quantity);

        if (totalRevenue == 0)
            return new List<ResponseDTOMonthRevenuePercentage>();

        var revenueByCategory = allOrderItems
        .GroupBy(oi => new
        {
            CategoryId = oi.Product.CategoryNav.Id,
            CategoryName = oi.Product.CategoryNav.Name
        })
        .Select(g => new ResponseDTOMonthRevenuePercentage
        {
            CategoryId = g.Key.CategoryId,
            CategoryName = g.Key.CategoryName,
            Revenue = g.Sum(x => x.UnitPrice * x.Quantity),
            Percentage = Math.Round((g.Sum(x => x.UnitPrice * x.Quantity) / totalRevenue) * 100, 2)
        })
        .OrderByDescending(x => x.Revenue)
        .ToList();

        return revenueByCategory;
    }

    public async Task<ResponseDTOTodayRevenue> GetAdminTodayRevenueAsync()
    {
        var orders = await _context.Order.GetAllOrderAsync();

        var todayStart = DateTime.UtcNow.Date;
        var todayEnd = todayStart.AddDays(1);


        var ordersToday = orders
          .Where(o => o.CreateAt >= todayStart && o.CreateAt < todayEnd && !o.Status.Equals("Cancelled"))
          .ToList();

        var revenue = ordersToday.Sum(o => (o.SubtotalAmount - o.DiscountAmount) - o.ShippingFee);
        var result = new ResponseDTOTodayRevenue
        {
            Revenue = revenue,
            OrderNumber = ordersToday.Count()
        };
        return result;
    }

    public async Task<IEnumerable<ResponseDTOMonthRevenue>> GetAdminRevenuePerMonthAllOrderAsync(int year)
    {
        var orders = await _context.Order.GetAllOrderAsync();

        var ordersInYear = orders
            .Where(o => o.CreateAt.Year == year && (o.Status.Equals("Completed") || o.Status.Equals("Paid")))
            .ToList();

        var grouped = ordersInYear
            .GroupBy(o => o.CreateAt.Month)
            .Select(g => new
            {
                Month = g.Key,
                TotalAmmount = g.Sum(x => x.TotalAmount),
                TotalShippingFee = g.Sum(x => x.ShippingFee),
                TotalDiscountAmmount = g.Sum(x => x.DiscountAmount),
                TotalOrderNumber = g.Count()
            })
            .ToList();

        var result = Enumerable.Range(1, 12)
            .Select(month => new ResponseDTOMonthRevenue
            {
                Month = month,
                TotalOrderNumber = (grouped.FirstOrDefault(x => x.Month == month)?.TotalOrderNumber ?? 0),
                Revenue = (grouped.FirstOrDefault(x => x.Month == month)?.TotalAmmount
                            - grouped.FirstOrDefault(x => x.Month == month)?.TotalShippingFee
                            + grouped.FirstOrDefault(x => x.Month == month)?.TotalDiscountAmmount ?? 0)
            })
            .ToList();

        return result;
    }

    public async Task<IEnumerable<ResponseDTOWeeklyRevenue>> GetAdminRevenuePerWeekAllOrderAsync(int year, int month)
    {
        var orders = await _context.Order.GetAllOrderAsync();


        var ordersInMonth = orders
        .Where(o => o.CreateAt.Year == year && o.CreateAt.Month == month && (o.Status.Equals("Completed") || o.Status.Equals("Paid")))
        .ToList();

        var weeklyRevenue = new List<ResponseDTOWeeklyRevenue>();


        var firstDayOfMonth = new DateTime(year, month, 1);
        var lastDayOfMonth = new DateTime(year, month, DateTime.DaysInMonth(year, month));

        var currentStart = firstDayOfMonth;
        int weekNumber = 1;

        while (currentStart <= lastDayOfMonth)
        {

            var currentEnd = currentStart.AddDays(6 - (int)currentStart.DayOfWeek + 1);
            if (currentEnd > lastDayOfMonth) currentEnd = lastDayOfMonth;


            var ordersInWeek = ordersInMonth
                .Where(o => o.CreateAt.Date >= currentStart.Date && o.CreateAt.Date <= currentEnd.Date)
                .ToList();

            var totalAmount = ordersInWeek.Sum(o => o.TotalAmount);
            var TotalShippingFee = ordersInWeek.Sum(o => o.ShippingFee);
            var TotalDiscountAmmount = ordersInWeek.Sum(o => o.DiscountAmount);

            weeklyRevenue.Add(new ResponseDTOWeeklyRevenue
            {
                WeekNumber = weekNumber,
                StartDate = currentStart,
                EndDate = currentEnd,
                TotalOrderNumber = ordersInWeek.Count(),
                Revenue = (totalAmount - TotalShippingFee + TotalDiscountAmmount)
            });

            currentStart = currentEnd.AddDays(1);
            weekNumber++;
        }

        return weeklyRevenue;
    }

    public async Task<IEnumerable<ResponseDTOMonthRevenue>> GetArtisanRevenuePerMonthAllOrderAsync(string? userId, int year)
    {
        var orders = await _context.Order.GetAllOrderByArtisanIdAsync(userId);

        var ordersInYear = orders
            .Where(o => o.CreateAt.Year == year && (o.Status.Equals("Completed") || o.Status.Equals("Paid")))
            .ToList();

        var revenueByMonth = ordersInYear
             .SelectMany(o => o.OrderItems
                .Where(oi => oi.Product.ArtisanId == userId)
                .Select(oi => new
                {
                    Month = o.CreateAt.Month,
                    Revenue = oi.Quantity * oi.UnitPrice
                })
            )
            .GroupBy(x => x.Month)
            .Select(g => new
            {
                Month = g.Key,
                TotalRevenue = g.Sum(x => x.Revenue)
            })
            .OrderBy(x => x.Month)
            .ToList();

        var orderCountByMonth = ordersInYear.Select(o => new
        {
            Month = o.CreateAt.Month,
            OrderId = o.Id
        })
                                .GroupBy(x => x.Month)
                                .Select(g => new
                                {
                                    Month = g.Key,
                                    TotalOrders = g.Select(x => x.OrderId).Distinct().Count()
                                }).ToList();
        var result = Enumerable.Range(1, 12)
            .Select(month => new ResponseDTOMonthRevenue
            {
                Month = month,
                TotalOrderNumber = orderCountByMonth.FirstOrDefault(x => x.Month == month)?.TotalOrders ?? 0,
                Revenue = (revenueByMonth.FirstOrDefault(x => x.Month == month)?.TotalRevenue ?? 0)
            })
            .ToList();

        return result;
    }

    public async Task<IEnumerable<ResponseDTOWeeklyRevenue>> GetArtisanRevenuePerWeekAllOrderAsync(string? userId, int year, int month)
    {
        var orders = await _context.Order.GetAllOrderByArtisanIdAsync(userId);

        // Chỉ lấy order trong tháng + đã thanh toán
        var ordersInMonth = orders
            .Where(o => o.CreateAt.Year == year
                     && o.CreateAt.Month == month
                     && (o.Status.Equals("Completed") || o.Status.Equals("Paid")))
            .ToList();

        var weeklyRevenue = new List<ResponseDTOWeeklyRevenue>();

        var firstDayOfMonth = new DateTime(year, month, 1);
        var lastDayOfMonth = new DateTime(year, month, DateTime.DaysInMonth(year, month));

        var currentStart = firstDayOfMonth;
        int weekNumber = 1;

        while (currentStart <= lastDayOfMonth)
        {
            var currentEnd = currentStart.AddDays(6 - (int)currentStart.DayOfWeek + 1);
            if (currentEnd > lastDayOfMonth)
                currentEnd = lastDayOfMonth;

            var ordersInWeek = ordersInMonth
                .Where(o => o.CreateAt.Date >= currentStart.Date &&
                            o.CreateAt.Date <= currentEnd.Date)
                .ToList();

            var totalProductAmount = ordersInWeek
                .SelectMany(o => o.OrderItems
                    .Where(oi => oi.Product.ArtisanId == userId)
                    .Select(oi => oi.Quantity * oi.UnitPrice)
                )
                .Sum();

            var revenue = totalProductAmount;

            var totalOrdersForSeller = ordersInWeek
                .Where(o => o.OrderItems.Any(oi => oi.Product.ArtisanId == userId))
                .Count();

            weeklyRevenue.Add(new ResponseDTOWeeklyRevenue
            {
                WeekNumber = weekNumber,
                StartDate = currentStart,
                EndDate = currentEnd,
                Revenue = revenue,
                TotalOrderNumber = totalOrdersForSeller
            });

            currentStart = currentEnd.AddDays(1);
            weekNumber++;
        }

        return weeklyRevenue;

    }

    public async Task<ResponseDTOTodayRevenue> GetArtisanTodayRevenueAsync(string? userId)
    {
        var orders = await _context.Order.GetAllOrderByArtisanIdAsync(userId);

        var todayStart = DateTime.UtcNow.Date;
        var todayEnd = todayStart.AddDays(1);

        var ordersToday = orders
          .Where(o => o.CreateAt >= todayStart && o.CreateAt < todayEnd && !o.Status.Equals("Cancelled"))
          .ToList();

        var ordersNeedActionToday = orders
         .Where(o => o.Status.Equals("WaitingForPickup"))
         .ToList();

        var revenue = ordersToday.Sum(o => (o.TotalAmount + o.DiscountAmount) - o.ShippingFee);
        var result = new ResponseDTOTodayRevenue
        {
            Revenue = revenue,
            OrderNumber = ordersNeedActionToday.Count()
        };
        return result;
    }

    public async Task<PagedResult<ResponseDTOOrder>> GetAllOrderByArtisanIdAsync(string userId, int pageIndex, int pageSize)
    {
        var orders = await _context.Order.GetAllOrderByArtisanIdAsync(userId);
        int totalPage = orders.Count();
        orders = orders.OrderByDescending(o => o.CreateAt).Skip((pageIndex - 1) * pageSize).Take(pageSize).ToList();

        var mapped = _mapper.Map<IEnumerable<ResponseDTOOrder>>(orders);

        return new PagedResult<ResponseDTOOrder>
        {
            Items = mapped,
            TotalCount = totalPage,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    private RealtimeOrderDto BuildOrderRealtimeDto(Order order, string? message)
    {
        return new RealtimeOrderDto
        {
            OrderId = order?.Id,
            OrderNumber = order?.OrderNumber,
            Status = order?.Status,
            TotalAmount = order?.TotalAmount ?? 0m,
            PaymentType = order?.PaymentType,
            UpdatedAt = DateTime.UtcNow,
            Message = message
        };
    }

    private Task PublishOrderRealtimeAsync(Order order, string? message)
    {
        return PublishOrderRealtimeAsync(order, message, includeArtisans: true);
    }

    private async Task PublishOrderRealtimeAsync(Order order, string? message, bool includeArtisans)
    {
        if (order == null)
        {
            return;
        }

        var dto = BuildOrderRealtimeDto(order, message);
        var tasks = new List<Task>();

        if (!string.IsNullOrWhiteSpace(order.CustomerId))
        {
            tasks.Add(_realtimeService.SendOrderUpdateAsync(order.CustomerId!, dto));
        }

        if (includeArtisans)
        {
            var artisanIds = await ResolveArtisanIdsAsync(order);
            foreach (var artisanId in artisanIds)
            {
                if (string.IsNullOrWhiteSpace(artisanId))
                {
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(order.CustomerId) &&
                    string.Equals(artisanId, order.CustomerId, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                tasks.Add(_realtimeService.SendOrderUpdateAsync(artisanId, dto));
            }
        }

        if (tasks.Count == 0)
        {
            return;
        }

        await Task.WhenAll(tasks);
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

}
