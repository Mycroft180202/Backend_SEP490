
using Backend_SEP490.Data;
using AutoMapper;
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

    public async Task<string> CreateOrderAsync(string? userId, RequestCreateOrder request)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return "Create order failed!(ID is empty)";
        }

        if (string.IsNullOrWhiteSpace(request.ShipingAddressId))
        {
            return "Shipping address is required!";
        }

        if (string.IsNullOrWhiteSpace(request.ReceiverName) ||
            string.IsNullOrWhiteSpace(request.ReceiverPhone))
        {
            return "Receiver information is required!";
        }

        if (request.ToDistrictId <= 0 || string.IsNullOrWhiteSpace(request.ToWardCode))
        {
            return "Destination information is required!";
        }

        if (request.TotalWeight <= 0)
        {
            return "Shipment weight must be greater than zero!";
        }

        await using var transaction = await _context.BeginTransactionAsync();

        try
        {
            var cart = await _context.Cart.GetCartByUserIdAsync(userId);
            if (cart == null)
            {
                await transaction.RollbackAsync();
                return "Create order failed!(Cart is empty)";
            }

            var cartItems = (await _context.CartItem.GetAllCartitemByCartIdAsync(cart.Id)).ToList();
            if (cartItems.Count == 0)
            {
                await transaction.RollbackAsync();
                return "Create order failed!(cartItem is empty)";
            }

            var shippingAddress = await _context.Address.GetAddressByIdAsync(request.ShipingAddressId);
            if (shippingAddress == null || !string.Equals(shippingAddress.UserID, userId, StringComparison.OrdinalIgnoreCase))
            {
                await transaction.RollbackAsync();
                return "Shipping address is invalid!";
            }

            var customer = await _context.Users.GetByIdAsync(userId);
            if (customer == null)
            {
                await transaction.RollbackAsync();
                return "Customer not found!";
            }

            var orderId = $"Order-{userId}-{Guid.NewGuid():N}";
            var order = new Order
            {
                Id = orderId,
                OrderNumber = GenerateId("ORDER"),
                CustomerId = userId,
                Status = "Pending",
                TotalAmount = cartItems.Sum(item => (item.PriceAtAdd ?? 0m) * (item.Quantity ?? 0)),
                ShipingAddressId = request.ShipingAddressId,
                CreateAt = DateTime.UtcNow,
            };

            var addOrderStatus = await _context.Order.CreateOrderAsync(order);
            if (!addOrderStatus)
            {
                await transaction.RollbackAsync();
                return "Create order failed!(addOrderStatus)";
            }

            var orderItems = cartItems
                .Select(item => new OrderItem
                {
                    Id = $"{orderId}-{item.ProductId}",
                    OrderID = orderId,
                    ProductID = item.ProductId,
                    Quantity = item.Quantity ?? 0,
                    UnitPrice = item.PriceAtAdd ?? 0m
                })
                .ToList();

            var addOrderItemStatus = await _context.OrderDetail.CreateOrderItemAsync(orderItems);
            if (!addOrderItemStatus)
            {
                await transaction.RollbackAsync();
                return "Create order item failed!(addOrderItemStatus)";
            }

            await transaction.CommitAsync();

            await NotifyOrderActorsAsync(order, orderItems);
            await TryCreateGhnShipmentsAsync(order, orderItems, shippingAddress, customer, request);
            return "Create order successfully!";
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

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
        await _context.SaveChangesAsync();
        foreach (var shipment in cancelledShipments)
        {
            await _shipmentRealtimeService.BroadcastAsync(order.CustomerId, shipment, "Shipment cancelled");
        }

        return "Cancel order successfully!";
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

    public async Task<IEnumerable<ResponseDTOOrder>> GetAllOrderByUserIdAsync(string? userId, RequestFilterOrder? requestFilter)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Enumerable.Empty<ResponseDTOOrder>();
        }

        var orders = await _context.Order.GetAllOrderByUserIdAsync(userId);

        if (requestFilter != null)
        {
            if (!string.IsNullOrWhiteSpace(requestFilter.search))
            {
                orders = orders.Where(o =>
                    o.OrderNumber != null &&
                    o.OrderNumber.Contains(requestFilter.search, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(requestFilter.Status))
            {
                orders = orders.Where(o =>
                    o.Status != null &&
                    string.Equals(o.Status, requestFilter.Status, StringComparison.OrdinalIgnoreCase));
            }

            if (requestFilter.CreateAt.HasValue)
            {
                var targetDate = requestFilter.CreateAt.Value.Date;
                orders = orders.Where(o => o.CreateAt.Date == targetDate);
            }
        }

        return _mapper.Map<IEnumerable<ResponseDTOOrder>>(orders);
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

    private async Task TryCreateGhnShipmentsAsync(
        Order order,
        List<OrderItem> orderItems,
        Address shippingAddress,
        User customer,
        RequestCreateOrder request)
    {
        try
        {
            var productIds = orderItems
                .Select(item => item.ProductID)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();

            var products = await _context.Products.GetProductsByIdsAsync(productIds);
            var productLookup = products
                .Where(p => !string.IsNullOrWhiteSpace(p.Id))
                .ToDictionary(p => p.Id!, p => p);

            var baseOptions = BuildBaseShipmentOptions(request, shippingAddress);
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

            var anyShipmentCreated = false;
            var createdShipments = new List<Shipment>();

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
    }

    private GhnShipmentOptions BuildBaseShipmentOptions(RequestCreateOrder request, Address shippingAddress)
    {
        var itemWeights = request.ShipmentItems?
            .Where(item =>
                !string.IsNullOrWhiteSpace(item.ProductId) &&
                item.Weight.HasValue &&
                item.Weight.Value > 0)
            .GroupBy(item => item.ProductId!)
            .ToDictionary(
                group => group.Key,
                group => group.First().Weight!.Value);

        return new GhnShipmentOptions
        {
            ReceiverName = request.ReceiverName,
            ReceiverPhone = request.ReceiverPhone,
            ToDistrictId = request.ToDistrictId,
            ToWardCode = request.ToWardCode,
            ToAddress = string.IsNullOrWhiteSpace(request.ToAddress)
                ? BuildFullAddress(shippingAddress)
                : request.ToAddress,
            ToProvinceName = string.IsNullOrWhiteSpace(request.ToProvinceName)
                ? shippingAddress.City
                : request.ToProvinceName,
            ItemWeights = itemWeights
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
        options.CodAmount = sellerSubtotal;
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
        options.CodAmount = subtotal;
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
}
