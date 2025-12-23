using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.SystemTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Backend_SEP490.SystemTests.Fixtures;

[CollectionDefinition(nameof(SystemTestCollection), DisableParallelization = true)]
public sealed class SystemTestCollection : ICollectionFixture<SystemTestFixture>
{
}

public sealed class SystemTestFixture : IAsyncLifetime
{
    private readonly SystemTestApplicationFactory _factory = new();
    private readonly Dictionary<string, AccountSession> _sessions = new(StringComparer.OrdinalIgnoreCase);

    public JsonSerializerOptions SerializerOptions { get; } = new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public SystemAccountCredential AdminAccount { get; } = new("Admin", "Nhat180202@@");
    public SystemAccountCredential CustomerAccount { get; } = new("Customer1", "Customer@123");
    public SystemAccountCredential ArtisanAccount { get; } = new("Artisan1", "Artisan@123");

    public string DefaultCategoryId { get; private set; } = string.Empty;

    public IServiceProvider Services => _factory.Services;

    public HttpClient CreateClient() => _factory.CreateClient();

    public async Task InitializeAsync()
    {
        await SeedSystemUsersAsync();
    }

    public Task DisposeAsync()
    {
        _factory.Dispose();
        return Task.CompletedTask;
    }

    public async Task<AccountSession> GetAdminSessionAsync() => await GetOrCreateSessionAsync(nameof(AdminAccount), AdminAccount);
    public async Task<AccountSession> GetCustomerSessionAsync() => await GetOrCreateSessionAsync(nameof(CustomerAccount), CustomerAccount);
    public async Task<AccountSession> GetArtisanSessionAsync() => await GetOrCreateSessionAsync(nameof(ArtisanAccount), ArtisanAccount);

    public HttpClient CreateAuthenticatedClient(AccountSession session)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
        return client;
    }

    private async Task<AccountSession> GetOrCreateSessionAsync(string key, SystemAccountCredential credential)
    {
        if (_sessions.TryGetValue(key, out var existing))
        {
            return existing;
        }

        var session = await AuthenticateAsync(credential);
        _sessions[key] = session;
        return session;
    }

    private async Task<AccountSession> AuthenticateAsync(SystemAccountCredential credential)
    {
        using var client = CreateClient();
        using var content = new MultipartFormDataContent
        {
            { new StringContent(credential.Username), "Username" },
            { new StringContent(credential.Password), "Password" }
        };

        var response = await client.PostAsync("/api/Auth/login", content);
        response.EnsureSuccessStatusCode();

        var tokens = await response.Content.ReadFromJsonAsync<AuthTokenResponse>(SerializerOptions);
        tokens.Should().NotBeNull("authentication must succeed for sandbox accounts");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokens!.AccessToken);
        var profile = await client.GetFromJsonAsync<UserProfileResponse>("/api/User/users/me", SerializerOptions);
        profile.Should().NotBeNull();

        return new AccountSession(credential, tokens.AccessToken, tokens.RefreshToken, profile!.UserID);
    }

    private async Task SeedSystemUsersAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        if (await db.Roles.AnyAsync())
        {
            DefaultCategoryId = await db.Categories.Select(c => c.Id).FirstAsync();
            return;
        }

        var now = DateTime.UtcNow;
        var adminRole = new Role { Id = "ROLE-ADMIN", Name = "Admin", Description = "System administrator" };
        var customerRole = new Role { Id = "ROLE-CUSTOMER", Name = "Customer", Description = "Standard customer" };
        var artisanRole = new Role { Id = "ROLE-ARTISAN", Name = "Artisan", Description = "Artisan" };

        db.Roles.AddRange(adminRole, customerRole, artisanRole);

        var admin = CreateUser("USER-ADMIN", AdminAccount, "admin@system.test", now);
        var customer = CreateUser("USER-CUSTOMER-1", CustomerAccount, "customer1@system.test", now);
        var artisan = CreateUser("USER-ARTISAN-1", ArtisanAccount, "artisan1@system.test", now);
        var artisan2 = CreateUser("USER-ARTISAN-2", new SystemAccountCredential("Artisan2", "Artisan@123"), "artisan2@system.test", now);

        admin.UserRoles = new List<UserRole> { CreateUserRole(admin, adminRole) };
        customer.UserRoles = new List<UserRole> { CreateUserRole(customer, customerRole) };
        artisan.UserRoles = new List<UserRole> { CreateUserRole(artisan, artisanRole) };
        artisan2.UserRoles = new List<UserRole> { CreateUserRole(artisan2, artisanRole) };

        db.Users.AddRange(admin, customer, artisan, artisan2);

        var category = new Category
        {
            Id = $"CAT-{Guid.NewGuid():N}",
            Name = "System Test Category"
        };
        db.Categories.Add(category);
        DefaultCategoryId = category.Id;

        await db.SaveChangesAsync();
    }

    private static UserRole CreateUserRole(User user, Role role) => new UserRole
    {
        Id = $"UR-{Guid.NewGuid():N}",
        UserID = user.UserID,
        RoleID = role.Id,
        Role = role,
        User = user
    };

    private static User CreateUser(string id, SystemAccountCredential credential, string email, DateTime now)
        => new User
        {
            UserID = id,
            Username = credential.Username,
            PasswordHash = HashPassword(credential.Password),
            Email = email,
            DisplayName = credential.Username,
            IsActive = true,
            CreateAt = now,
            UpdateAt = now
        };

    private static string HashPassword(string password)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    private sealed record AuthTokenResponse(string AccessToken, string RefreshToken, DateTime ExpireAt);

    private sealed record UserProfileResponse(string UserID, string Username, bool IsActive, List<ResponseDTORole>? Roles);
}

public sealed record SystemAccountCredential(string Username, string Password);

public sealed record AccountSession(SystemAccountCredential Credential, string AccessToken, string RefreshToken, string UserId);
