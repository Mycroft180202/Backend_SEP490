using Backend_SEP490.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Backend_SEP490.Services.Background;

public class VoucherAutomationHostedService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(12);
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<VoucherAutomationHostedService> _logger;

    public VoucherAutomationHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<VoucherAutomationHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await RunJobsAsync(stoppingToken);

            try
            {
                await Task.Delay(Interval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                // Ignored when stopping
            }
        }
    }

    private async Task RunJobsAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var voucherService = scope.ServiceProvider.GetRequiredService<IVoucherService>();
            await voucherService.RunAutomationJobsAsync(cancellationToken);
        }
        catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogError(ex, "Voucher automation job failed.");
        }
    }
}
