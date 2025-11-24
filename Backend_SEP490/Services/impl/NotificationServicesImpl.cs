using System.Collections.Generic;
using System.Globalization;
using System.Linq;
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
    private static readonly CultureInfo VietnamCulture = CultureInfo.GetCultureInfo("vi-VN");

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
            var totalFormatted = FormatMoney(order.TotalAmount);
            var message = $"Don hang {order.OrderNumber} da duoc tao thanh cong. Tong tien: {totalFormatted}.";
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

            var message = $"Ban co don hang moi #{order.OrderNumber}: {string.Join(", ", productNames)}.";
            notifications.Add(CreateNotification(group.Key!, NotificationTypes.ArtisanOrder, message));
        }

        if (notifications.Count == 0)
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

        var customerName = customer?.DisplayName ?? customer?.Username ?? "Khach hang";
        var ratingText = feedback?.Rating.HasValue == true ? $"{feedback.Rating}/5" : "mot danh gia moi";
        var message = $"{customerName} vua de lai {ratingText} cho san pham {product.Name}.";

        if (!string.IsNullOrWhiteSpace(feedback?.Comment))
        {
            message += $" Loi nhan: \"{feedback.Comment}\"";
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

        var discount = FormatDiscount(voucher);
        var description = string.IsNullOrWhiteSpace(voucher.Description)
            ? "Uu dai moi dang cho ban"
            : voucher.Description;

        var message = $"Voucher {voucher.Code}: giam {discount}. {description}. Dung truoc {voucher.EndDate:dd/MM}.";

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

    public async Task NotifyVoucherGrantedAsync(string userId, Voucher voucher, string? customMessage)
    {
        if (string.IsNullOrWhiteSpace(userId) || voucher == null)
        {
            return;
        }

        var message = customMessage ??
                      $"Ban nhan duoc voucher {voucher.Code} tri gia {FormatDiscount(voucher)}. Dung truoc {voucher.EndDate:dd/MM}.";

        var notification = CreateNotification(userId, NotificationTypes.VoucherGift, message);
        await _context.Notifications.AddAsync(notification);
        await _context.SaveChangesAsync();
        await SendRealtimeAsync(notification);
    }

    public async Task NotifyVoucherEventExpiringAsync(Voucher voucher, IEnumerable<string> userIds)
    {
        if (voucher == null || userIds == null)
        {
            return;
        }

        var idList = userIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (idList.Count == 0)
        {
            return;
        }

        var message = $"Voucher {voucher.Code} sap het han vao {voucher.EndDate:dd/MM}. Dung ngay de khong lo nhes!";
        var notifications = idList
            .Select(id => CreateNotification(id, NotificationTypes.VoucherReminder, message))
            .ToList();

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

        var reporterName = reporter?.DisplayName ?? reporter?.Username ?? "Nguoi dung";
        var productName = product?.Name ?? report.TargetID ?? "san pham";
        var reason = string.IsNullOrWhiteSpace(report.Reason) ? "khong ro ly do" : report.Reason;

        var notifications = new List<Notification>();

        if (!string.IsNullOrWhiteSpace(product?.ArtisanId))
        {
            var artisanMessage = $"{reporterName} vua bao cao san pham {productName} vi \"{reason}\". Vui long kiem tra.";
            notifications.Add(CreateNotification(product.ArtisanId, NotificationTypes.ArtisanReport, artisanMessage));
        }

        var admins = await _context.Users.GetUsersByRoleAsync("Admin");
        foreach (var admin in admins.Where(a => !string.IsNullOrWhiteSpace(a.UserID)))
        {
            var adminMessage = $"{reporterName} da bao cao {productName} vi \"{reason}\".";
            notifications.Add(CreateNotification(admin.UserID!, NotificationTypes.ReportAlert, adminMessage));
        }

        if (notifications.Count == 0)
        {
            _logger.LogWarning("No recipients found to notify about report {ReportId}.", report.Id);
            return;
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
            ? $"Don hang {orderNumber}"
            : $"Don hang {payment.OrderID}";

        var message = $"{orderLabel} vua cap nhat trang thai thanh toan thanh \"{payment.PaymentStatus}\".";

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
        var message = $"Ho so tho {application.Id} cua {applicantName} dang cho duyet.";

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
        var statusText = approved ? "duoc chap nhan" : "bi tu choi";

        var message = $"Ho so tho {application.Id} {statusText}.";
        if (!approved && !string.IsNullOrWhiteSpace(application.RejectReason))
        {
            message += $" Ly do: {application.RejectReason}.";
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

    private static string FormatMoney(decimal amount)
    {
        return amount.ToString("N0", VietnamCulture) + " VND";
    }

    private static string FormatDiscount(Voucher voucher)
    {
        if (voucher == null)
        {
            return string.Empty;
        }

        if (string.Equals(voucher.DiscountType, "Percent", StringComparison.OrdinalIgnoreCase))
        {
            return $"{voucher.DiscountValue}%";
        }

        return FormatMoney(voucher.DiscountValue);
    }
}
