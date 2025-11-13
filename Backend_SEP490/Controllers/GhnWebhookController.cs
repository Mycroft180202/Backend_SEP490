using Backend_SEP490.DTOs.External.Ghn;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Route("api/ghn/webhook")]
[ApiController]
[AllowAnonymous]
public class GhnWebhookController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;
    private readonly ILogger<GhnWebhookController> _logger;

    public GhnWebhookController(
        IUnitOfWork unitOfWork,
        INotificationService notificationService,
        ILogger<GhnWebhookController> logger)
    {
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Receive([FromBody] GhnWebhookPayload payload)
    {
        if (payload == null || string.IsNullOrWhiteSpace(payload.OrderCode))
        {
            return BadRequest("OrderCode is required.");
        }

        var shipment = await _unitOfWork.Shipment.GetByTrackingNumberAsync(payload.OrderCode);
        if (shipment == null)
        {
            _logger.LogWarning("GHN webhook received for unknown order code {OrderCode}.", payload.OrderCode);
            return Ok();
        }

        shipment.ShippingStatus = payload.CurrentStatus ?? shipment.ShippingStatus;
        if (IsDeliveredStatus(payload.CurrentStatus))
        {
            shipment.DeliveredAt = payload.UpdatedDate ?? DateTime.UtcNow;
        }

        var order = await _unitOfWork.Order.GetAllOrderByIdAsync(shipment.OrderID);
        if (order != null)
        {
            order.Status = DetermineOrderStatus(payload.CurrentStatus, order.Status);
        }

        if (payload.CodCollected == true && order?.CustomerId != null)
        {
            var payments = await _unitOfWork.Payments.GetByOrderIdAsync(order.Id);
            foreach (var payment in payments)
            {
                if (!string.Equals(payment.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase))
                {
                    payment.PaymentStatus = "Paid";
                    payment.ProccessedAt = DateTime.UtcNow;
                    await _notificationService.NotifyPaymentStatusAsync(payment, order.CustomerId, order.OrderNumber);
                }
            }
        }

        await _unitOfWork.SaveChangesAsync();
        return Ok(new { status = "ack" });
    }

    private static bool IsDeliveredStatus(string? status) =>
        string.Equals(status, "delivered", StringComparison.OrdinalIgnoreCase);

    private static bool IsCancelledStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return false;
        }

        var normalized = status.Trim().ToLowerInvariant();
        return normalized.Contains("cancel") || normalized.Contains("return");
    }

    private static string DetermineOrderStatus(string? shipmentStatus, string? fallback)
    {
        if (IsDeliveredStatus(shipmentStatus))
        {
            return "Completed";
        }

        if (IsCancelledStatus(shipmentStatus))
        {
            return "Cancelled";
        }

        return fallback ?? "Shipping";
    }
}
