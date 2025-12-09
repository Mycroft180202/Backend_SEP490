using Backend_SEP490.Data;
using Backend_SEP490.DTOs.External.Ghn;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Services;
using Backend_SEP490.Services.Background;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Backend_SEP490.SystemTests.Infrastructure;

public sealed class SystemTestApplicationFactory : WebApplicationFactory<Program>
{
    private static readonly object EnvLock = new();
    private static bool _envInitialized;

    public SystemTestApplicationFactory()
    {
        EnsureEnvironmentVariables();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            RemoveHostedService<NotificationCleanupService>(services);
            RemoveHostedService<OrderCleanupService>(services);
            RemoveHostedService<VoucherAutomationHostedService>(services);

            services.RemoveAll<IProductServices>();
            services.AddScoped<IProductServices, TestProductServices>();

            services.RemoveAll<IEmbeddingService>();
            services.AddSingleton<IEmbeddingService, FakeEmbeddingService>();

            services.RemoveAll<IGhnShippingService>();
            services.AddSingleton<IGhnShippingService, FakeGhnShippingService>();

            services.RemoveAll<IGhnMasterDataService>();
            services.AddSingleton<IGhnMasterDataService, FakeGhnMasterDataService>();

            services.RemoveAll<IEmailService>();
            services.AddSingleton<IEmailService, FakeEmailService>();

            services.RemoveAll<IPaymentService>();
            services.AddSingleton<IPaymentService, FakePaymentService>();

            services.RemoveAll<IShipmentRealtimeService>();
            services.AddSingleton<IShipmentRealtimeService, FakeShipmentRealtimeService>();

            var provider = services.BuildServiceProvider();
            using var scope = provider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }

    private static void RemoveHostedService<THostedService>(IServiceCollection services)
        where THostedService : class, IHostedService
    {
        var descriptor = services.FirstOrDefault(d =>
            d.ServiceType == typeof(IHostedService) &&
            d.ImplementationType == typeof(THostedService));

        if (descriptor != null)
        {
            services.Remove(descriptor);
        }
    }

    private static void EnsureEnvironmentVariables()
    {
        if (_envInitialized)
        {
            return;
        }

        lock (EnvLock)
        {
            if (_envInitialized)
            {
                return;
            }

            var defaults = new Dictionary<string, string>
            {
                ["ConnectionStrings__DefaultConnection"] = "Host=localhost;Database=system-tests;Username=test;Password=test",
                ["CLOUDINARY_CLOUD_NAME"] = "system-tests",
                ["CLOUDINARY_API_KEY"] = "tests",
                ["CLOUDINARY_API_SECRET"] = "tests",
                ["OPENAI_API_KEY"] = "system-tests-openai",
                ["JWT_KEY"] = "system-tests-secret-key-123456789",
                ["JWT_ISSUER"] = "system-tests",
                ["JWT_AUDIENCE"] = "system-tests",
                ["EMAIL_HOST"] = "smtp.system.tests",
                ["EMAIL_PORT"] = "2525",
                ["EMAIL_USERNAME"] = "system@test.dev",
                ["EMAIL_PASSWORD"] = "tests-password",
                ["Cors__AllowedOrigins__0"] = "https://frontend.system.tests"
            };

            foreach (var kv in defaults)
            {
                if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(kv.Key)))
                {
                    Environment.SetEnvironmentVariable(kv.Key, kv.Value);
                }
            }

            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Testing");

            _envInitialized = true;
        }
    }
}

internal sealed class FakeEmbeddingService : IEmbeddingService
{
    public Task<double[]> GenerateEmbeddingAsync(string text) => Task.FromResult(BuildVector(text));

    public Task<Dictionary<string, double[]>> GenerateEmbeddingBatchAsync(IEnumerable<string> texts)
    {
        var dict = texts
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .ToDictionary(t => t, BuildVector, StringComparer.OrdinalIgnoreCase);
        return Task.FromResult(dict);
    }

    public double[]? GetCachedEmbedding(string text) => BuildVector(text);

    private static double[] BuildVector(string text)
    {
        var random = new Random(text?.Length ?? 0);
        var data = new double[8];
        for (var i = 0; i < data.Length; i++)
        {
            data[i] = Math.Round(random.NextDouble(), 4);
        }

        return data;
    }
}

internal sealed class FakeGhnShippingService : IGhnShippingService
{
    public Task<bool> CancelOrderAsync(string? orderCode, string? clientOrderCode, string? reason = null, CancellationToken cancellationToken = default)
        => Task.FromResult(true);

    public Task<GhnCalculateFeeResponse?> CalculateShippingFeeAsync(GhnCalculateFeeRequest request, CancellationToken cancellationToken = default)
        => Task.FromResult<GhnCalculateFeeResponse?>(new GhnCalculateFeeResponse
        {
            Code = 200,
            Data = new GhnFeeData { Total = 15000 }
        });

    public Task<GhnCreateOrderResponse?> CreateShippingOrderAsync(
        Order order,
        IEnumerable<OrderItem> orderItems,
        Address shippingAddress,
        User customer,
        GhnShipmentOptions? shipmentOptions,
        IEnumerable<Product> products,
        CancellationToken cancellationToken = default)
        => Task.FromResult<GhnCreateOrderResponse?>(new GhnCreateOrderResponse
        {
            Code = 200,
            Data = new GhnCreateOrderData
            {
                OrderCode = $"GHN-{Guid.NewGuid():N}",
                ExpectedDeliveryTime = DateTime.UtcNow.AddDays(2),
                TotalFee = 18000,
                Status = "ready_to_pick"
            }
        });
}

internal sealed class FakeGhnMasterDataService : IGhnMasterDataService
{
    public Task<IEnumerable<GhnDistrict>> GetDistrictsAsync(int provinceId, CancellationToken cancellationToken = default)
        => Task.FromResult<IEnumerable<GhnDistrict>>(new[]
        {
            new GhnDistrict { DistrictId = 101, ProvinceId = provinceId, DistrictName = "System Test District" }
        });

    public Task<IEnumerable<GhnProvince>> GetProvincesAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IEnumerable<GhnProvince>>(new[]
        {
            new GhnProvince { ProvinceId = 1, ProvinceName = "System Test Province" }
        });

    public Task<IEnumerable<GhnWard>> GetWardsAsync(int districtId, CancellationToken cancellationToken = default)
        => Task.FromResult<IEnumerable<GhnWard>>(new[]
        {
            new GhnWard { WardCode = "W1", DistrictId = districtId, WardName = "System Test Ward" }
        });
}

internal sealed class FakeEmailService : IEmailService
{
    public Task SendEmailAsync(string to, string subject, string body) => Task.CompletedTask;
}

internal sealed class FakePaymentService : IPaymentService
{
    public Task<VnpayPaymentResponse?> CreateVnpayPaymentAsync(string userId, CreateVnpayPaymentRequest request, string clientIp)
        => Task.FromResult<VnpayPaymentResponse?>(new VnpayPaymentResponse
        {
            PaymentId = $"PAY-{Guid.NewGuid():N}",
            OrderId = request.OrderId ?? Guid.NewGuid().ToString("N"),
            Amount = 100000,
            PaymentUrl = "https://payments.system.tests/checkout",
            QrContent = "SYSTEM-TEST-QR",
            ExpiredAt = DateTime.UtcNow.AddMinutes(10)
        });

    public Task<VnpayCallbackResult> HandleVnpayCallbackAsync(IQueryCollection queryCollection)
        => Task.FromResult(new VnpayCallbackResult { Success = true, Status = "success" });

    public Task<string> UpdatePaymentStatusAsync(UpdatePaymentStatusRequest request)
        => Task.FromResult("Payment updated successfully");
}

internal sealed class FakeShipmentRealtimeService : IShipmentRealtimeService
{
    public Task BroadcastAsync(string userId, Shipment shipment, string? note = null) => Task.CompletedTask;
}
