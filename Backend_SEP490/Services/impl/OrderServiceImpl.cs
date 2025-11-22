
using Backend_SEP490.Data;
using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using Backend_SEP490.Config;
using Backend_SEP490.DTOs.External.Ghn;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Repositories.impl;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Backend_SEP490.Services.impl;

public class OrderServiceImpl : GenericServices, IOrderService
{
    private const string PlatformSellerId = "PLATFORM";
    private const string PaymentTypeCod = "COD";
    private const string PaymentTypeVnpay = "VNPAY";

    private readonly INotificationService _notificationService;
    private readonly IGhnShippingService _ghnShippingService;
    private readonly IShipmentRealtimeService _shipmentRealtimeService;
    private readonly ILogger<OrderServiceImpl> _logger;
    private readonly GhnSettings _ghnSettings;

    public OrderServiceImpl(
        IMapper mapper,
        IUnitOfWork unitOfWork,
        INotificationService notificationService,
        IGhnShippingService ghnShippingService,
        IShipmentRealtimeService shipmentRealtimeService,
        IOptions<GhnSettings> ghnOptions,
        ILogger<OrderServiceImpl> logger) : base(mapper, unitOfWork)
    {
        _notificationService = notificationService;
        _ghnShippingService = ghnShippingService;
        _shipmentRealtimeService = shipmentRealtimeService;
        _logger = logger;
        _ghnSettings = ghnOptions.Value;
    }

    private static string GenerateId(string prefix) => $"{prefix}-{DateTime.UtcNow:yyyyMMdd-HHmmssfff}";

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

        if (request.ShippingServiceId <= 0)
        {
            return CreateOrderResult.Failure("shippingServiceId must be greater than zero.");
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

            var subtotal = orderItemInputs.Sum(info => info.UnitPrice * info.Quantity);

            //var shippingAddress = await CreateOrderShippingAddressAsync(userId, address);
            if (address == null)
            {
                await transaction.RollbackAsync();
                return CreateOrderResult.Failure("Unable to save shipping address for this order.");
            }

            var (feeSuccess, shippingFee, feeError) = await CalculateShippingFeeAsync(
                request,
                address,
                orderItemInputs);
            if (!feeSuccess)
            {
                await transaction.RollbackAsync();
                return CreateOrderResult.Failure(feeError ?? "Unable to calculate shipping fee.");
            }

            var (voucherSuccess, discountAmount, voucher, voucherError) =
                await ApplyVoucherAsync(request.VoucherCodeId, subtotal);
            if (!voucherSuccess)
            {
                await transaction.RollbackAsync();
                return CreateOrderResult.Failure(voucherError ?? "Unable to apply voucher.");
            }

            var totalAmount = Math.Max(0m, subtotal - discountAmount + shippingFee);

            var orderId = $"Order-{userId}-{Guid.NewGuid():N}";
            var order = new Order
            {
                Id = orderId,
                OrderNumber = GenerateId("ORDER"),
                CustomerId = userId,
                Status = "Pending",
                PaymentType = paymentType,
                TotalAmount = totalAmount,
                SubtotalAmount = subtotal,
                DiscountAmount = discountAmount,
                ShippingFee = shippingFee,
                ShipingAddressId = address.Id,
                ShippingServiceId = request.ShippingServiceId,
                ShippingServiceTypeId = request.ServiceTypeId,
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

            return response;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
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

    private async Task<(bool Success, decimal Fee, string? Message)> CalculateShippingFeeAsync(
        RequestCreateOrder request,
        Address destination,
        IEnumerable<OrderItemInput> orderItems)
    {
        if (!destination.GhnDistrictId.HasValue || string.IsNullOrWhiteSpace(destination.GhnWardCode))
        {
            return (false, 0m, "Shipping address is missing GHN mapping data.");
        }

        var mappedItems = orderItems
            .Select(info => new OrderItem
            {
                ProductID = info.ProductId,
                Quantity = info.Quantity,
                UnitPrice = info.UnitPrice
            })
            .ToList();

        var shippingProfiles = orderItems
            .Where(info => info.Product.ShippingProfile != null)
            .ToDictionary(info => info.ProductId, info => info.Product.ShippingProfile!);

        var weight = CalculateTotalWeight(mappedItems, null, shippingProfiles);
        var length = ResolveDimension(mappedItems, null, shippingProfiles, p => p.LengthCm, _ghnSettings.DefaultParcelLength);
        var width = ResolveDimension(mappedItems, null, shippingProfiles, p => p.WidthCm, _ghnSettings.DefaultParcelWidth);
        var height = ResolveDimension(mappedItems, null, shippingProfiles, p => p.HeightCm, _ghnSettings.DefaultParcelHeight);

        var requestModel = new GhnCalculateFeeRequest
        {
            ServiceId = request.ShippingServiceId,
            ServiceTypeId = request.ServiceTypeId,
            ToDistrictId = destination.GhnDistrictId.Value,
            ToWardCode = destination.GhnWardCode!,
            Weight = Math.Max(weight, _ghnSettings.DefaultItemWeight),
            Length = length,
            Width = width,
            Height = height,
            InsuranceValue = (int)Math.Round(mappedItems.Sum(item => item.UnitPrice * item.Quantity))
        };

        var response = await _ghnShippingService.CalculateShippingFeeAsync(requestModel);
        if (response == null)
        {
            _logger.LogWarning("GHN fee calculation returned null. Defaulting shipping fee to zero.");
            return (true, 0m, null);
        }

        var successCodes = new[] { 0, 200 };
        if (!successCodes.Contains(response.Code) || response.Data == null)
        {
            _logger.LogWarning(
                "GHN fee calculation failed with code {Code} and message '{Message}'. Using zero fee.",
                response.Code,
                response.Message);
            return (true, 0m, null);
        }

        var fee = response.Data.Total ?? 0;
        return (true, fee, null);
    }

    private async Task<(bool Success, decimal Discount, Voucher? Voucher, string? Message)> ApplyVoucherAsync(
        string? voucherCode,
        decimal orderAmount)
    {
        if (string.IsNullOrWhiteSpace(voucherCode))
        {
            return (true, 0m, null, null);
        }

        var voucher = await _context.Voucher.GetVoucherByCodeAsync(voucherCode.Trim());
        if (voucher == null)
        {
            return (false, 0m, null, "Voucher not found.");
        }

        var now = DateTime.UtcNow;
        if (now < voucher.StartDate || now > voucher.EndDate)
        {
            return (false, 0m, null, "Voucher is not active.");
        }

        if (!voucher.IsActive)
        {
            return (false, 0m, null, "Voucher is inactive.");
        }

        var remainingUses = voucher.UsageLimit.HasValue
            ? Math.Max(voucher.UsageLimit.Value - voucher.UsedCount, 0)
            : voucher.UsedCount;

        if (remainingUses <= 0)
        {
            return (false, 0m, null, "Voucher usage limit reached.");
        }

        if (voucher.MinOrderAmount.HasValue && orderAmount < voucher.MinOrderAmount.Value)
        {
            return (false, 0m, null, "Order amount does not meet voucher requirements.");
        }

        decimal discount;
        if (string.Equals(voucher.DiscountType, "Percent", StringComparison.OrdinalIgnoreCase))
        {
            var percent = voucher.DiscountValue / 100m;
            if (percent < 0m)
            {
                percent = 0m;
            }
            else if (percent > 1m)
            {
                percent = 1m;
            }
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
            voucher.UsedCount++;
        }
        else
        {
            voucher.UsedCount = Math.Max(voucher.UsedCount - 1, 0);
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
            return "Order id is required!";
        }

        var order = await _context.Order.GetAllOrderByIdAsync(orderId);
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

        var shipments = await _context.Shipment.GetByOrderIdAsync(order.Id);
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

        order.Status = "Cancelled";
        await RestoreOrderStockAsync(order);
        await _context.SaveChangesAsync();
        foreach (var shipment in cancelledShipments)
        {
            await _shipmentRealtimeService.BroadcastAsync(order.CustomerId, shipment, "Shipment cancelled");
        }

        return "Cancel order successfully!";
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
                if (!string.Equals(order.Status, "Shipping", StringComparison.OrdinalIgnoreCase))
                {
                    order.Status = "Shipping";
                    await _context.SaveChangesAsync();
                }
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

    public async Task<ResponseDTOOrder?> GetOrderByIdAsync(string orderId, int pageIndex, int pageSize)
    {
        if (pageIndex < 1)
        {
            pageIndex = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 10;
        }

        var order = await _context.Order.GetAllOrderByIdAsync(orderId);
        if (order == null)
        {
            return null;
        }

        var orderDetail = _mapper.Map<ResponseDTOOrder>(order);
        
        //orderDetail.Items ??= new List<ResponseDTOOrderItem>();
        //orderDetail.Items = orderDetail.Items
        //    .Skip((pageIndex - 1) * pageSize)
        //    .Take(pageSize)
        //    .ToList();

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
                order.Status = "Shipping";
                await _context.SaveChangesAsync();
                foreach (var shipment in createdShipments)
                {
                    await _shipmentRealtimeService.BroadcastAsync(order.CustomerId, shipment, "Shipment created");
                }
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
            ServiceId = order.ShippingServiceId > 0 ? order.ShippingServiceId : _ghnSettings.ServiceId,
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

    public async Task<IEnumerable<ResponseDTOOrder>> GetNewestOrderAsync()
    {
        var order = await _context.Order.GetNewestOrderAsync();
        var mapped = _mapper.Map<IEnumerable<ResponseDTOOrder>>(order);
        return mapped;
    }

    public async Task<IEnumerable<ResponseDTOMonthRevenue>> GetAdminRevenuePerMonthAllOrderAsync(int year)
    {
        var orders = await _context.Order.GetAllOrderAsync();

        var ordersInYear = orders
            .Where(o => o.CreateAt.Year == year && o.Status.Equals("Paid"))
            .ToList();

        var grouped = ordersInYear
            .GroupBy(o => o.CreateAt.Month)
            .Select(g => new
            {
                Month = g.Key,
                TotalAmmount = g.Sum(x => x.TotalAmount),
                TotalShippingFee = g.Sum(x => x.ShippingFee),
                TotalDiscountAmmount = g.Sum(x => x.DiscountAmount)
            })
            .ToList();

        var result = Enumerable.Range(1, 12)
            .Select(month => new ResponseDTOMonthRevenue
            {
                Month = month,
                TotalOrderAmount = grouped.FirstOrDefault(x => x.Month == month)?.TotalAmmount ?? 0,
                Revenue = (grouped.FirstOrDefault(x => x.Month == month)?.TotalAmmount
                            - grouped.FirstOrDefault(x => x.Month == month)?.TotalShippingFee
                            + grouped.FirstOrDefault(x => x.Month == month)?.TotalDiscountAmmount ?? 0) * 0.05m
            })
            .ToList();

        return result;
    }

    public async Task<IEnumerable<ResponseDTOWeeklyRevenue>> GetAdminRevenuePerWeekAllOrderAsync(int year, int month)
    {
        var orders = await _context.Order.GetAllOrderAsync();


        var ordersInMonth = orders
        .Where(o => o.CreateAt.Year == year && o.CreateAt.Month == month && o.Status.Equals("Paid"))
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

            var totalAmount = ordersInWeek.Sum(o => o.TotalAmount );
            var TotalShippingFee = ordersInWeek.Sum(o =>  o.ShippingFee );
            var TotalDiscountAmmount = ordersInWeek.Sum(o =>  o.DiscountAmount);

            weeklyRevenue.Add(new ResponseDTOWeeklyRevenue
            {
                WeekNumber = weekNumber,
                StartDate = currentStart,
                EndDate = currentEnd,
                TotalOrderAmount = totalAmount,
                Revenue = (totalAmount - TotalShippingFee + TotalDiscountAmmount) * 0.05m
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
            .Where(o => o.CreateAt.Year == year && o.Status.Equals("Paid"))
            .ToList();

        var grouped = ordersInYear
            .GroupBy(o => o.CreateAt.Month)
            .Select(g => new
            {
                Month = g.Key,
                TotalAmmount = g.Sum(x => x.TotalAmount),
                TotalShippingFee = g.Sum(x =>x.ShippingFee),
                TotalDiscountAmmount = g.Sum(x =>  x.DiscountAmount)
            })
            .ToList();

        var result = Enumerable.Range(1, 12)
            .Select(month => new ResponseDTOMonthRevenue
            {
                Month = month,
                TotalOrderAmount = grouped.FirstOrDefault(x => x.Month == month)?.TotalAmmount ?? 0,
                Revenue = (grouped.FirstOrDefault(x => x.Month == month)?.TotalAmmount 
                            - grouped.FirstOrDefault(x => x.Month == month)?.TotalShippingFee
                            + grouped.FirstOrDefault(x => x.Month == month)?.TotalDiscountAmmount ?? 0) * 0.95m
            })
            .ToList();

        return result;
    }

    public async Task<IEnumerable<ResponseDTOWeeklyRevenue>> GetArtisanRevenuePerWeekAllOrderAsync(string? userId, int year, int month)
    {
        var orders = await _context.Order.GetAllOrderByArtisanIdAsync(userId);


        var ordersInMonth = orders
        .Where(o => o.CreateAt.Year == year && o.CreateAt.Month == month && o.Status.Equals("Paid"))
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
                TotalOrderAmount = totalAmount,
                Revenue = (totalAmount - TotalShippingFee + TotalDiscountAmmount) * 0.95m
            });

            currentStart = currentEnd.AddDays(1);
            weekNumber++;
        }

        return weeklyRevenue;
    }
}
