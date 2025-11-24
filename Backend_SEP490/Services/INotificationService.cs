using System.Collections.Generic;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services;

public interface INotificationService
{
    Task<PagedResult<ResponseNotificationDto>> GetNotificationsAsync(string userId, NotificationFilterRequest request);
    Task<bool> MarkAsReadAsync(string userId, string notificationId);
    Task<int> MarkAllAsReadAsync(string userId);
    Task<bool> RemoveAsync(string userId, string notificationId);
    Task AdminSendNotificationAsync(string adminId, AdminSendNotificationRequest request);

    Task NotifyOrderCreatedAsync(
        Order order,
        IReadOnlyCollection<OrderItem> orderItems,
        IReadOnlyDictionary<string, Product> productLookup);

    Task NotifyArtisanFeedbackAsync(Product product, User customer, RequestDTOFeedback feedback);
    Task NotifyPromotionAsync(Voucher voucher);
    Task NotifyVoucherGrantedAsync(string userId, Voucher voucher, string? customMessage);
    Task NotifyVoucherEventExpiringAsync(Voucher voucher, IEnumerable<string> userIds);
    Task NotifyAdminsProductReportedAsync(Report report, Product product, User reporter);
    Task NotifyPaymentStatusAsync(Payment payment, string customerId, string? orderNumber);
    Task NotifyArtisanApplicationSubmittedAsync(ArtisanApplication application, User applicant);
    Task NotifyArtisanApplicationReviewedAsync(ArtisanApplication application, User applicant);
}
