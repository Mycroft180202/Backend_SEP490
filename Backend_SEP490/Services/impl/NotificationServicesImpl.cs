using System.Globalization;
using AutoMapper;
using Backend_SEP490.Constants;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Hubs;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Backend_SEP490.Services.impl;

public class NotificationServicesImpl : GenericServices, INotificationService
{
    private readonly IHubContext<NotificationHub, INotificationClient> _hubContext;
    private readonly ILogger<NotificationServicesImpl> _logger;

    public NotificationServicesImpl(
        IMapper mapper,
        IUnitOfWork unitOfWork,
        IHubContext<NotificationHub, INotificationClient> hubContext,
        ILogger<NotificationServicesImpl> logger) : base(mapper, unitOfWork)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<PagedResult<ResponseNotificationDto>> GetNotificationsAsync(string userId, NotificationFilterRequest request)
    {
        if (string.IsNullOrWhiteSpace(userId)) throw new ArgumentNullException(nameof(userId));
        request ??= new NotificationFilterRequest();

        var pageIndex = request.PageIndex <= 0 ? 1 : request.PageIndex;
        var pageSize = request.PageSize <= 0 ? 20 : Math.Min(request.PageSize, 100);

        var notifications = await _context.Notifications
            .GetByUserAsync(userId, pageIndex, pageSize, request.UnreadOnly, request.Type);
        var totalCount = await _context.Notifications
            .CountByUserAsync(userId, request.UnreadOnly, request.Type);

        return new PagedResult<ResponseNotificationDto>
        {
            Items = _mapper.Map<IEnumerable<ResponseNotificationDto>>(notifications),
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    public async Task<bool> MarkAsReadAsync(string userId, string notificationId)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(notificationId))
        {
            return false;
        }

        var notification = await _context.Notifications.FindByIdAsync(notificationId);
        if (notification == null || !string.Equals(notification.UserID, userId, StringComparison.Ordinal))
        {
            return false;
        }

        if (notification.IsRead)
        {
            return true;
        }

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        await _hubContext.Clients
            .Group(NotificationHub.GetUserGroup(userId))
            .NotificationRead(notificationId);

        return true;
    }

    public async Task<int> MarkAllAsReadAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return 0;
        }

        var ids = await _context.Notifications.MarkAllAsReadAsync(userId);
        if (ids.Count == 0)
        {
            return 0;
        }

        await _context.SaveChangesAsync();

        await _hubContext.Clients
            .Group(NotificationHub.GetUserGroup(userId))
            .NotificationsMarkedAsRead(ids);

        return ids.Count;
    }

    public async Task<bool> RemoveAsync(string userId, string notificationId)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(notificationId))
        {
            return false;
        }

        var notification = await _context.Notifications.FindByIdAsync(notificationId);
        if (notification == null || !string.Equals(notification.UserID, userId, StringComparison.Ordinal))
        {
            return false;
        }

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        await _hubContext.Clients
            .Group(NotificationHub.GetUserGroup(userId))
            .NotificationDeleted(notificationId);

        return true;
    }

    public async Task AdminSendNotificationAsync(string adminId, AdminSendNotificationRequest request)
    {
        if (request == null) throw new ArgumentNullException(nameof(request));
        if (string.IsNullOrWhiteSpace(request.TargetUserId))
        {
            throw new ArgumentException("Target user is required.", nameof(request));
        }

        var targetUser = await _context.Users.GetByIdAsync(request.TargetUserId);
        if (targetUser == null)
        {
            throw new InvalidOperationException("Target user not found.");
        }

        var notification = CreateNotification(
            request.TargetUserId,
            string.IsNullOrWhiteSpace(request.Type) ? NotificationTypes.AdminDirect : request.Type,
            request.Message);
        
        await _context.Notifications.AddAsync(notification);
        await _context.SaveChangesAsync();

        await SendRealtimeAsync(notification);

        _logger.LogInformation("Admin {AdminId} sent notification {NotificationId} to user {UserId}.",
            adminId, notification.Id, request.TargetUserId);
    }

    public async Task NotifyOrderCreatedAsync(
        Order order,
        IReadOnlyCollection<OrderItem> orderItems,
        IReadOnlyDictionary<string, Product> productLookup)
    {
        if (order == null || orderItems == null || productLookup == null)
        {
            return;
        }

        var notifications = new List<Notification>();

        if (!string.IsNullOrWhiteSpace(order.CustomerId))
        {
            var totalFormatted = order.TotalAmount.ToString("N0", CultureInfo.InvariantCulture);
            var message = $"Đơn hàng {order.OrderNumber} đã được tạo thành công với tổng giá trị {totalFormatted}₫.";
            notifications.Add(CreateNotification(order.CustomerId, NotificationTypes.OrderUpdate, message));
        }

        var artisanGroups = orderItems
            .Where(item => productLookup.ContainsKey(item.ProductID))
            .GroupBy(item => productLookup[item.ProductID].ArtisanId);

        foreach (var group in artisanGroups)
        {
            if (string.IsNullOrWhiteSpace(group.Key))
            {
                continue;
            }

            var productNames = group
                .Select(item => productLookup[item.ProductID].Name)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct();

            var message = $"Bạn có đơn hàng mới #{order.OrderNumber} gồm: {string.Join(", ", productNames)}.";
            notifications.Add(CreateNotification(group.Key!, NotificationTypes.ArtisanOrder, message));
        }

        if (!notifications.Any())
        {
            return;
        }

        await _context.Notifications.AddRangeAsync(notifications);
        await _context.SaveChangesAsync();
        await SendRealtimeAsync(notifications);
    }

    public async Task NotifyArtisanFeedbackAsync(Product product, User customer, RequestDTOFeedback feedback)
    {
        if (product == null || string.IsNullOrWhiteSpace(product.ArtisanId))
        {
            return;
        }

        var customerName = customer?.DisplayName ?? customer?.Username ?? "Khách hàng";
        var ratingText = feedback.Rating.HasValue ? $"{feedback.Rating}/5⭐" : "một đánh giá mới";
        var message = $"{customerName} đã để lại {ratingText} cho sản phẩm {product.Name}.";

        if (!string.IsNullOrWhiteSpace(feedback.Comment))
        {
            message += $" Nội dung: \"{feedback.Comment}\"";
        }

        var notification = CreateNotification(product.ArtisanId, NotificationTypes.ArtisanFeedback, message);

        await _context.Notifications.AddAsync(notification);
        await _context.SaveChangesAsync();
        await SendRealtimeAsync(notification);
    }

    public async Task NotifyPromotionAsync(Voucher voucher)
    {
        if (voucher == null)
        {
            return;
        }

        var users = await _context.Users.GetActiveUsersAsync();
        if (users.Count == 0)
        {
            return;
        }

        var discount = voucher.DiscountType?.Equals("Percent", StringComparison.OrdinalIgnoreCase) == true
            ? $"{voucher.DiscountValue}%"
            : $"{voucher.DiscountValue:N0}₫";

        var description = string.IsNullOrWhiteSpace(voucher.Description)
            ? "ưu đãi mới"
            : voucher.Description;

        var message = $"Ưu đãi {voucher.Code}: giảm {discount} - {description}. Đừng bỏ lỡ!";

        var notifications = users
            .Where(u => !string.IsNullOrWhiteSpace(u.UserID))
            .Select(u => CreateNotification(u.UserID, NotificationTypes.Promotion, message))
            .ToList();

        if (notifications.Count == 0)
        {
            return;
        }

        await _context.Notifications.AddRangeAsync(notifications);
        await _context.SaveChangesAsync();
        await SendRealtimeAsync(notifications);
    }

    public async Task NotifyAdminsProductReportedAsync(Report report, Product product, User reporter)
    {
        if (report == null)
        {
            return;
        }

        var reporterName = reporter?.DisplayName ?? reporter?.Username ?? "Người dùng";
        var productName = product?.Name ?? report.TargetID ?? "sản phẩm";
        var reason = string.IsNullOrWhiteSpace(report.Reason) ? "không nêu lý do" : report.Reason;

        var message = $"{reporterName} đã báo cáo {productName} vì \"{reason}\".";
        var notifications = new List<Notification>();

        if (!string.IsNullOrWhiteSpace(product?.ArtisanId))
        {
            var artisanMessage = $"{reporterName} vừa báo cáo sản phẩm {productName} vì \"{reason}\". Vui lòng kiểm tra ngay.";
            notifications.Add(CreateNotification(product.ArtisanId, NotificationTypes.ArtisanReport, artisanMessage));
        }

        var admins = await _context.Users.GetUsersByRoleAsync("Admin");
        if (admins.Count == 0 && notifications.Count == 0)
        {
            _logger.LogWarning("No recipients found to notify about report {ReportId}.", report.Id);
            return;
        }

        if (admins.Count > 0)
        {
            var adminNotifications = admins
                .Where(a => !string.IsNullOrWhiteSpace(a.UserID))
                .Select(a => CreateNotification(a.UserID, NotificationTypes.ReportAlert, message))
                .ToList();

            notifications.AddRange(adminNotifications);
        }

        await _context.Notifications.AddRangeAsync(notifications);
        await _context.SaveChangesAsync();
        await SendRealtimeAsync(notifications);
    }

    public async Task NotifyPaymentStatusAsync(Payment payment, string customerId, string? orderNumber)
    {
        if (payment == null || string.IsNullOrWhiteSpace(customerId))
        {
            return;
        }

        var orderLabel = !string.IsNullOrWhiteSpace(orderNumber)
            ? $"Đơn hàng {orderNumber}"
            : $"Đơn hàng {payment.OrderID}";

        var message = $"{orderLabel} đã cập nhật trạng thái thanh toán thành \"{payment.PaymentStatus}\".";

        var notification = CreateNotification(customerId, NotificationTypes.PaymentStatus, message);
        await _context.Notifications.AddAsync(notification);
        await _context.SaveChangesAsync();
        await SendRealtimeAsync(notification);
    }

    public async Task NotifyArtisanApplicationSubmittedAsync(ArtisanApplication application, User applicant)
    {
        if (application == null || applicant == null)
        {
            return;
        }

        var admins = await _context.Users.GetUsersByRoleAsync("Admin");
        if (admins == null || admins.Count == 0)
        {
            _logger.LogWarning("No admins found to receive artisan application {ApplicationId}.", application.Id);
            return;
        }

        var applicantName = applicant.DisplayName ?? applicant.Username ?? applicant.Email ?? application.FullName ?? "User";
        var message = $"New artisan application from {applicantName} ({application.Id}) is waiting for review.";

        var notifications = admins
            .Where(a => !string.IsNullOrWhiteSpace(a.UserID))
            .Select(a => CreateNotification(a.UserID, NotificationTypes.ArtisanApplicationSubmitted, message))
            .ToList();

        if (notifications.Count == 0)
        {
            return;
        }

        await _context.Notifications.AddRangeAsync(notifications);
        await _context.SaveChangesAsync();
        await SendRealtimeAsync(notifications);
    }

    public async Task NotifyArtisanApplicationReviewedAsync(ArtisanApplication application, User applicant)
    {
        if (application == null || applicant == null || string.IsNullOrWhiteSpace(applicant.UserID))
        {
            return;
        }

        var approved = string.Equals(application.Status, ArtisanApplicationStatus.Done, StringComparison.OrdinalIgnoreCase);
        var type = approved ? NotificationTypes.ArtisanApplicationApproved : NotificationTypes.ArtisanApplicationRejected;
        var statusText = approved ? "approved" : "rejected";

        var message = $"Your artisan application {application.Id} was {statusText}.";
        if (!approved && !string.IsNullOrWhiteSpace(application.RejectReason))
        {
            message += $" Reason: {application.RejectReason}.";
        }

        var notification = CreateNotification(applicant.UserID, type, message);
        await _context.Notifications.AddAsync(notification);
        await _context.SaveChangesAsync();
        await SendRealtimeAsync(notification);
    }

    private Notification CreateNotification(string userId, string type, string message)
    {
        return new Notification
        {
            Id = $"NOTI-{Guid.NewGuid():N}",
            UserID = userId,
            Message = message,
            Type = type,
            IsRead = false,
            CreateAt = DateTime.UtcNow
        };
    }

    private Task SendRealtimeAsync(Notification notification)
    {
        var dto = _mapper.Map<ResponseNotificationDto>(notification);
        return _hubContext.Clients
            .Group(NotificationHub.GetUserGroup(notification.UserID))
            .ReceiveNotification(dto);
    }

    private Task SendRealtimeAsync(IEnumerable<Notification> notifications)
    {
        var tasks = notifications.Select(SendRealtimeAsync);
        return Task.WhenAll(tasks);
    }
}
