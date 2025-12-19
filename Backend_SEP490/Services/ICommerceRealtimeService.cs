using System.Collections.Generic;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services;

public interface ICommerceRealtimeService
{
    Task SendCartSnapshotAsync(string userId, ResponseDTOCart cart);
    Task SendCartAdjustmentsAsync(IEnumerable<RealtimeCartItemAdjustmentDto> adjustments);
    Task SendOrderUpdateAsync(string userId, RealtimeOrderDto orderUpdate);
    Task SendPaymentUpdateAsync(string userId, RealtimePaymentDto paymentUpdate);
    Task BroadcastProductStockAsync(IEnumerable<RealtimeProductStockDto> updates);
}
