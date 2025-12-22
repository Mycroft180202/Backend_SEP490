using System.Collections.Generic;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Hubs;

public interface INotificationClient
{
    Task ReceiveNotification(ResponseNotificationDto notification);
    Task NotificationRead(string notificationId);
    Task NotificationsMarkedAsRead(IEnumerable<string> notificationIds);
    Task NotificationDeleted(string notificationId);
    Task ShipmentStatusUpdated(ShipmentStatusUpdateDto update);
    Task CartUpdated(RealtimeCartDto cart);
    Task CartItemAdjusted(RealtimeCartItemAdjustmentDto adjustment);
    Task OrderUpdated(RealtimeOrderDto update);
    Task PaymentUpdated(RealtimePaymentDto update);
    Task ProductStockUpdated(RealtimeProductStockDto update);
}
