using Backend_SEP490.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend_SEP490.Services.Background;

public class NotificationCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval;

    public NotificationCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<NotificationCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _cleanupInterval = TimeSpan.FromHours(1);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await CleanupAsync(stoppingToken);

            try
            {
                await Task.Delay(_cleanupInterval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                // Ignore when stopping
            }
        }
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            var threshold = DateTime.UtcNow.AddDays(-7);
            var expired = await unitOfWork.Notifications.GetExpiredAsync(threshold);

            if (expired.Count == 0)
            {
                return;
            }

            unitOfWork.Notifications.RemoveRange(expired);
            await unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Removed {Count} notifications older than {Threshold}.", expired.Count, threshold);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogError(ex, "Failed to cleanup expired notifications.");
        }
    }
}
