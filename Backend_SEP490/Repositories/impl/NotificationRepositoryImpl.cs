using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class NotificationRepositoryImpl : GenericRepositoryImpl<Notification>, INotificationRepository
{
    public NotificationRepositoryImpl(AppDbContext context) : base(context)
    {
    }

    public async Task AddRangeAsync(IEnumerable<Notification> notifications)
    {
        await _context.Notifications.AddRangeAsync(notifications);
    }

    public async Task<List<Notification>> GetByUserAsync(string userId, int pageIndex, int pageSize, bool? unreadOnly, string? type)
    {
        if (pageIndex < 1) pageIndex = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserID == userId);

        if (unreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(n => n.Type == type);
        }

        return await query
            .OrderByDescending(n => n.CreateAt ?? DateTime.UnixEpoch)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> CountByUserAsync(string userId, bool? unreadOnly, string? type)
    {
        var query = _context.Notifications
            .Where(n => n.UserID == userId);

        if (unreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(n => n.Type == type);
        }

        return await query.CountAsync();
    }

    public async Task<Notification?> FindByIdAsync(string notificationId)
    {
        return await _context.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId);
    }

    public async Task<List<string>> MarkAllAsReadAsync(string userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserID == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        return notifications
            .Select(n => n.Id)
            .ToList();
    }

    public async Task<List<Notification>> GetExpiredAsync(DateTime threshold)
    {
        return await _context.Notifications
            .Where(n => n.CreateAt.HasValue && n.CreateAt.Value < threshold)
            .ToListAsync();
    }

    public void RemoveRange(IEnumerable<Notification> notifications)
    {
        _context.Notifications.RemoveRange(notifications);
    }
}
