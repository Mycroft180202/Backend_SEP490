using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Backend_SEP490.Models;
using Backend_SEP490.Services.Background;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Backend_SEP490.IntegrationTests;

public class CustomWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
{
    private readonly string _databaseName = $"IntegrationTests_{Guid.NewGuid():N}";
    private static readonly object EnvLock = new();
    private static bool _envInitialized;

    public CustomWebApplicationFactory()
    {
        EnsureEnvironmentVariables();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            ReplaceDbContext(services);
            ConfigureTestAuthentication(services);
            RemoveHostedService<NotificationCleanupService>(services);
            RemoveHostedService<OrderCleanupService>(services);
            RemoveHostedService<VoucherAutomationHostedService>(services);

            var provider = services.BuildServiceProvider();
            using var scope = provider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }

    private void ReplaceDbContext(IServiceCollection services)
    {
        var descriptor = services.FirstOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
        if (descriptor != null)
        {
            services.Remove(descriptor);
        }

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseInMemoryDatabase(_databaseName);
        });
    }

    private static void ConfigureTestAuthentication(IServiceCollection services)
    {
        services.AddAuthentication(TestAuthHandler.SchemeName)
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });

        services.PostConfigureAll<AuthenticationOptions>(options =>
        {
            options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
            options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
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
                ["ConnectionStrings__DefaultConnection"] = "Host=localhost;Database=integration-tests;Username=test;Password=test",
                ["CLOUDINARY_CLOUD_NAME"] = "integration-test",
                ["CLOUDINARY_API_KEY"] = "1234567890",
                ["CLOUDINARY_API_SECRET"] = "integration-secret",
                ["OPENAI_API_KEY"] = "test-openai-key",
                ["JWT_KEY"] = "integration-test-jwt-secret-key",
                ["JWT_ISSUER"] = "integration-tests",
                ["JWT_AUDIENCE"] = "integration-tests",
                ["EMAIL_HOST"] = "smtp.integration.test",
                ["EMAIL_PORT"] = "2525",
                ["EMAIL_USERNAME"] = "integration@test.dev",
                ["EMAIL_PASSWORD"] = "integration-password",
                ["Cors__AllowedOrigins__0"] = "https://frontend.test"
            };

            foreach (var kvp in defaults)
            {
                if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(kvp.Key)))
                {
                    Environment.SetEnvironmentVariable(kvp.Key, kvp.Value);
                }
            }

            _envInitialized = true;
        }
    }

    private sealed class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public const string SchemeName = "TestAuth";

        public TestAuthHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ISystemClock clock) : base(options, logger, encoder, clock)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var authMarker = Request.Headers["X-Test-Auth"].FirstOrDefault();
            if (string.Equals(authMarker, "fail", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(AuthenticateResult.Fail("Requested failure"));
            }

            if (string.Equals(authMarker, "skip", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            var claims = new List<Claim>();
            var userId = Request.Headers["X-Test-UserId"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(userId))
            {
                claims.Add(new Claim("userId", userId));
                claims.Add(new Claim("userID", userId));
            }

            var roles = Request.Headers["X-Test-Roles"];
            if (roles.Count > 0)
            {
                foreach (var header in roles)
                {
                    if (string.IsNullOrWhiteSpace(header))
                    {
                        continue;
                    }

                    var splitted = header.Split(',', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var role in splitted)
                    {
                        claims.Add(new Claim(ClaimTypes.Role, role.Trim()));
                    }
                }
            }

            if (claims.Count == 0)
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
    }
}
