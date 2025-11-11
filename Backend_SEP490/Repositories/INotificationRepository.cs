using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface INotificationRepository : IGenericRepository<Notification>
{
    Task AddRangeAsync(IEnumerable<Notification> notifications);
    Task<List<Notification>> GetByUserAsync(string userId, int pageIndex, int pageSize, bool? unreadOnly, string? type);
    Task<int> CountByUserAsync(string userId, bool? unreadOnly, string? type);
    Task<Notification?> FindByIdAsync(string notificationId);
    Task<List<string>> MarkAllAsReadAsync(string userId);
    Task<List<Notification>> GetExpiredAsync(DateTime threshold);
    void RemoveRange(IEnumerable<Notification> notifications);
}
