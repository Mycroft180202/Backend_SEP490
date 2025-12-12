using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace Backend_SEP490.Services.Background;

public class OrderCleanupService : BackgroundService
{
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan PaymentGracePeriod = TimeSpan.FromDays(30);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderCleanupService> _logger;

    public OrderCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<OrderCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await CleanupExpiredOrdersAsync(stoppingToken);

            try
            {
                await Task.Delay(CleanupInterval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                // Ignore cancellation exceptions that occur while stopping
            }
        }
    }

    private async Task CleanupExpiredOrdersAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();

            await orderService.CancelUnconfirmedOrdersAsync(TimeSpan.FromHours(24), cancellationToken);

            var thresholdUtc = DateTime.UtcNow.Subtract(PaymentGracePeriod);
            var candidates = await unitOfWork.Order.GetPendingOrdersBeforeAsync(thresholdUtc);
            if (candidates.Count == 0)
            {
                return;
            }

            var removable = candidates
                .Where(order =>
                {
                    if (order.Payments == null || order.Payments.Count == 0)
                    {
                        return true;
                    }

                    return !order.Payments.Any(payment =>
                        !string.IsNullOrWhiteSpace(payment.PaymentStatus) &&
                        payment.PaymentStatus.Equals("Paid", StringComparison.OrdinalIgnoreCase));
                })
                .ToList();

            if (removable.Count == 0)
            {
                return;
            }

            unitOfWork.Order.RemoveRange(removable);
            await unitOfWork.SaveChangesAsync();

            _logger.LogInformation(
                "Removed {Count} pending orders older than {ThresholdUtc}.",
                removable.Count,
                thresholdUtc);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogError(ex, "Failed to cleanup expired pending orders.");
        }
    }
}
