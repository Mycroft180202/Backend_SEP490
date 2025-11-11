using System.Security.Claims;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyNotifications([FromQuery] NotificationFilterRequest request)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await _notificationService.GetNotificationsAsync(userId, request ?? new NotificationFilterRequest());
        return Ok(result);
    }

    [HttpPut("{notificationId}/read")]
    public async Task<IActionResult> MarkAsRead([FromRoute] string notificationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var updated = await _notificationService.MarkAsReadAsync(userId, notificationId);
        if (!updated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPut("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var count = await _notificationService.MarkAllAsReadAsync(userId);
        return Ok(new { updated = count });
    }

    [HttpDelete("{notificationId}")]
    public async Task<IActionResult> DeleteNotification([FromRoute] string notificationId)
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var removed = await _notificationService.RemoveAsync(userId, notificationId);
        if (!removed)
        {
            return NotFound();
        }

        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("admin/send")]
    public async Task<IActionResult> AdminSend([FromBody] AdminSendNotificationRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminId = GetUserId();
        try
        {
            await _notificationService.AdminSendNotificationAsync(adminId ?? string.Empty, request);
            return Ok("Notification sent.");
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    private string? GetUserId()
    {
        return User.FindFirstValue("userId") ?? User.FindFirstValue("userID");
    }
}
