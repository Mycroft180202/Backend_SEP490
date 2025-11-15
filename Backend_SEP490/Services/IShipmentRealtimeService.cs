using Backend_SEP490.Models;

namespace Backend_SEP490.Services;

public interface IShipmentRealtimeService
{
    Task BroadcastAsync(string userId, Shipment shipment, string? note = null);
}
