using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Hubs;
using Backend_SEP490.Models;
using Microsoft.AspNetCore.SignalR;

namespace Backend_SEP490.Services.impl;

public class ShipmentRealtimeService : IShipmentRealtimeService
{
    private readonly IHubContext<NotificationHub, INotificationClient> _hubContext;

    public ShipmentRealtimeService(IHubContext<NotificationHub, INotificationClient> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task BroadcastAsync(string userId, Shipment shipment, string? note = null)
    {
        if (string.IsNullOrWhiteSpace(userId) || shipment == null)
        {
            return Task.CompletedTask;
        }

        var payload = new ShipmentStatusUpdateDto
        {
            OrderId = shipment.OrderID,
            ShipmentId = shipment.Id,
            TrackingNumber = shipment.TrackingNumber,
            Status = shipment.ShippingStatus,
            Timestamp = DateTime.UtcNow,
            Note = note
        };

        return _hubContext
            .Clients
            .Group(NotificationHub.GetUserGroup(userId))
            .ShipmentStatusUpdated(payload);
    }
}
