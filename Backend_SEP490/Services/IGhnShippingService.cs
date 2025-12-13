using Backend_SEP490.DTOs.External.Ghn;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services;

public interface IGhnShippingService
{
    Task<GhnCreateOrderResponse?> CreateShippingOrderAsync(
        Order order,
        IEnumerable<OrderItem> orderItems,
        Address shippingAddress,
        User customer,
        GhnShipmentOptions? shipmentOptions,
        IEnumerable<Product> products,
        CancellationToken cancellationToken = default);

    Task<bool> CancelOrderAsync(
        string? orderCode,
        string? clientOrderCode,
        string? reason = null,
        CancellationToken cancellationToken = default);

    Task<GhnCalculateFeeResponse?> CalculateShippingFeeAsync(
        GhnCalculateFeeRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<GhnAvailableService>?> GetAvailableServicesAsync(
        int fromDistrictId,
        int toDistrictId,
        int? serviceTypeId,
        int? shopIdOverride = null,
        string? tokenOverride = null,
        CancellationToken cancellationToken = default);
}
