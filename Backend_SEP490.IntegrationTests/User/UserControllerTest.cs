using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Backend_SEP490.Controllers;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using UserEntity = global::User;

namespace Backend_SEP490.IntegrationTests.Users;

[CollectionDefinition(nameof(UserControllerCollection), DisableParallelization = true)]
public sealed class UserControllerCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}

[Collection(nameof(UserControllerCollection))]
public sealed class UserControllerTests : IDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IServiceScope _scope;
    private readonly AppDbContext _db;
    private readonly IUserServices _userServices;
    private readonly IAddressService _addressService;

    public UserControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        _scopeFactory = factory.Services.GetRequiredService<IServiceScopeFactory>();
        _scope = _scopeFactory.CreateScope();
        _db = _scope.ServiceProvider.GetRequiredService<AppDbContext>();
        _userServices = _scope.ServiceProvider.GetRequiredService<IUserServices>();
        _addressService = _scope.ServiceProvider.GetRequiredService<IAddressService>();
    }

    public void Dispose()
    {
        _scope.Dispose();
    }

    // ---------- Tests ----------

    [Fact]
    public async Task GetUsersById_Returns_NotFound_For_Unknown_User()
    {
        var controller = CreateController();

        var result = await controller.GetUsersById("UNKNOWN-USER");

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetUsersById_Returns_User_When_Exists()
    {
        var user = await CreateUserAsync();

        try
        {
            var controller = CreateController();

            var result = await controller.GetUsersById(user.UserId);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var dto = ok.Value.Should().BeAssignableTo<ResponseDTOUser>().Subject;
            dto.UserID.Should().Be(user.UserId);
            dto.Email.Should().Be(user.Email);
        }
        finally
        {
            await CleanupUserAsync(user);
        }
    }

    [Fact]
    public async Task GetUsersProfile_Returns_NotFound_When_UserId_Missing()
    {
        var controller = CreateController();

        var result = await controller.GetUsersProfile();

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetUsersProfile_Returns_User_When_Authenticated()
    {
        var user = await CreateUserAsync();

        try
        {
            var controller = CreateController(CreatePrincipal(user.UserId));

            var result = await controller.GetUsersProfile();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var dto = ok.Value.Should().BeAssignableTo<ResponseDTOUser>().Subject;
            dto.UserID.Should().Be(user.UserId);
        }
        finally
        {
            await CleanupUserAsync(user);
        }
    }

    [Fact]
    public async Task UpdateUsersProfile_Returns_BadRequest_When_ModelState_Invalid()
    {
        var user = await CreateUserAsync();

        try
        {
            var controller = CreateController(CreatePrincipal(user.UserId));
            controller.ModelState.AddModelError("RolesId", "Required");

            var payload = new RequestUpdateUser
            {
                IsActive = true,
                DisplayName = "AB",
                PhoneNumber = "123",
                RolesId = null
            };

            var result = await controller.UpdateUsersProfile(payload);

            result.Should().BeOfType<BadRequestObjectResult>();
        }
        finally
        {
            await CleanupUserAsync(user);
        }
    }

    [Fact]
    public async Task UpdateUsersProfile_Persists_Changes_When_Data_Valid()
    {
        var user = await CreateUserAsync();
        var role = await EnsureRoleAsync();

        try
        {
            var controller = CreateController(CreatePrincipal(user.UserId));

            var payload = new RequestUpdateUser
            {
                IsActive = false,
                DisplayName = "Updated Tester",
                PhoneNumber = "0912345678",
                RolesId = role.Id,
                UserUrlImage = "https://example.com/avatar.png"
            };

            var result = await controller.UpdateUsersProfile(payload);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            ok.Value.Should().BeOfType<string>().Which.Should().Contain("Update user information");

            using (var verifyScope = _scopeFactory.CreateScope())
            {
                var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();

                var refreshed = await verifyDb.Users.Include(u => u.UserRoles)
                    .FirstAsync(u => u.UserID == user.UserId);
                refreshed.DisplayName.Should().Be("Updated Tester");
                refreshed.PhoneNumber.Should().Be("0912345678");
                refreshed.IsActive.Should().BeFalse();
                refreshed.UserRoles.Should().ContainSingle(ur => ur.RoleID == role.Id);
            }
        }
        finally
        {
            await CleanupUserAsync(user);
            await CleanupRoleAsync(role.Id);
        }
    }

    [Fact]
    public async Task ChangePassword_Returns_Error_When_OldPassword_Wrong()
    {
        var user = await CreateUserAsync();

        try
        {
            var controller = CreateController(CreatePrincipal(user.UserId));

            var payload = new RequestUpdateUserHashPassword
            {
                OldPassword = "Wrong123!",
                NewPassword = "Bb2@bcde",
                ConfirmNewPassword = "Bb2@bcde"
            };

            var result = await controller.UpdateUserPassword(payload);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            ok.Value.Should().BeOfType<string>().Which.Should().Contain("Wrong old password");

            using (var verifyScope = _scopeFactory.CreateScope())
            {
                var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();

                var refreshed = await verifyDb.Users.AsNoTracking().FirstAsync(u => u.UserID == user.UserId);
                refreshed.PasswordHash.Should().Be(HashPassword(user.PlainPassword));
            }
        }
        finally
        {
            await CleanupUserAsync(user);
        }
    }

    [Fact]
    public async Task ChangePassword_Updates_Hash_When_Data_Valid()
    {
        var user = await CreateUserAsync();

        try
        {
            var controller = CreateController(CreatePrincipal(user.UserId));

            var newPassword = "Cc3@cdef";
            var payload = new RequestUpdateUserHashPassword
            {
                OldPassword = user.PlainPassword,
                NewPassword = newPassword,
                ConfirmNewPassword = newPassword
            };

            var result = await controller.UpdateUserPassword(payload);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            ok.Value.Should().BeOfType<string>().Which.Should().Contain("Change password successfully");

            using (var verifyScope = _scopeFactory.CreateScope())
            {
                var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();

                var refreshed = await verifyDb.Users.AsNoTracking().FirstAsync(u => u.UserID == user.UserId);
                refreshed.PasswordHash.Should().Be(HashPassword(newPassword));
            }
        }
        finally
        {
            await CleanupUserAsync(user);
        }
    }

    [Fact]
    public async Task GetAllUsersAddress_Returns_Empty_When_User_Has_No_Address()
    {
        var user = await CreateUserAsync();

        try
        {
            var controller = CreateController(CreatePrincipal(user.UserId));

            var result = await controller.GetAllUsersAddress();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var addresses = ok.Value.Should().BeAssignableTo<IEnumerable<ResponseDTOAddress>>().Subject;
            addresses.Should().BeEmpty();
        }
        finally
        {
            await CleanupUserAsync(user);
        }
    }

    [Fact]
    public async Task GetAllUsersAddress_Returns_Addresses_When_They_Exist()
    {
        var user = await CreateUserAsync();

        try
        {
            await CreateAddressEntityAsync(user.UserId, "First street", "HCM");
            await CreateAddressEntityAsync(user.UserId, "Second street", "Hanoi");

            var controller = CreateController(CreatePrincipal(user.UserId));

            var result = await controller.GetAllUsersAddress();

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            var addresses = ok.Value.Should().BeAssignableTo<IEnumerable<ResponseDTOAddress>>().Subject.ToList();
            addresses.Should().HaveCount(2);
            addresses.Select(a => a.Line1).Should().Contain(new[] { "First street", "Second street" });
        }
        finally
        {
            await CleanupUserAsync(user);
        }
    }

    [Fact]
    public async Task CreateUsersAddress_Returns_Status_Message()
    {
        var user = await CreateUserAsync();

        try
        {
            var controller = CreateController(CreatePrincipal(user.UserId));

            var payload = new RequestCreateAndUpdateAddress
            {
                Line1 = "123 Test Street",
                City = "HCM",
                PosttalCode = "700000",
                Country = "Vietnam",
                IsDefault = true
            };

            var result = await controller.CreateUsersAddress(payload);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            ok.Value.Should().BeOfType<string>().Which.Should().Contain("Create Address");

            using (var verifyScope = _scopeFactory.CreateScope())
            {
                var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();

                var stored = await verifyDb.Addresses.Where(a => a.UserID == user.UserId).ToListAsync();
                stored.Should().ContainSingle();
                stored[0].Line1.Should().Be("123 Test Street");
            }
        }
        finally
        {
            await CleanupUserAsync(user);
        }
    }

    [Fact]
    public async Task UpdateUsersAddress_Returns_Status_Message()
    {
        var user = await CreateUserAsync();

        try
        {
            var address = await CreateAddressEntityAsync(user.UserId, "Old street", "HCM");

            var controller = CreateController(CreatePrincipal(user.UserId));

            var payload = new RequestCreateAndUpdateAddress
            {
                Line1 = "New street",
                City = "Da Nang",
                PosttalCode = "550000",
                Country = "Vietnam",
                IsDefault = true
            };

            var result = await controller.UpdateUsersAddress(address.Id, payload);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            ok.Value.Should().BeOfType<string>().Which.Should().Contain("Update Address");

            using (var verifyScope = _scopeFactory.CreateScope())
            {
                var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();

                var refreshed = await verifyDb.Addresses.AsNoTracking().FirstAsync(a => a.Id == address.Id);
                refreshed.Line1.Should().Be("New street");
                refreshed.City.Should().Be("Da Nang");
                refreshed.IsDefault.Should().BeTrue();
            }
        }
        finally
        {
            await CleanupUserAsync(user);
        }
    }

    [Fact]
    public async Task DeleteUsersAddress_Returns_Status_Message_When_Deleted()
    {
        var user = await CreateUserAsync();

        try
        {
            var address = await CreateAddressEntityAsync(user.UserId, "To delete", "Hue");

            var controller = CreateController(CreatePrincipal(user.UserId));

            var result = await controller.DeleteUsersAddress(address.Id);

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            ok.Value.Should().BeOfType<string>().Which.Should().Contain("Delete Address");

            using (var verifyScope = _scopeFactory.CreateScope())
            {
                var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();

                var remaining = await verifyDb.Addresses.Where(a => a.UserID == user.UserId).ToListAsync();
                remaining.Should().BeEmpty();
            }
        }
        finally
        {
            await CleanupUserAsync(user);
        }
    }

    [Fact]
    public async Task DeleteUsersAddress_Returns_NotFound_Message_When_Address_Missing()
    {
        var user = await CreateUserAsync();

        try
        {
            var controller = CreateController(CreatePrincipal(user.UserId));

            var result = await controller.DeleteUsersAddress($"ADR-{Guid.NewGuid().ToString("N")}");

            var ok = result.Should().BeOfType<OkObjectResult>().Subject;
            ok.Value.Should().BeOfType<string>().Which.Should().Contain("Address not found");
        }
        finally
        {
            await CleanupUserAsync(user);
        }
    }

    // ---------- Helpers ----------

    private UserController CreateController(ClaimsPrincipal? principal = null)
    {
        var httpContext = new DefaultHttpContext
        {
            User = principal ?? new ClaimsPrincipal(new ClaimsIdentity())
        };

        return new UserController(_userServices, _addressService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            }
        };
    }

    private static ClaimsPrincipal CreatePrincipal(string userId)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim("userID", userId),
            new Claim(ClaimTypes.NameIdentifier, userId)
        }, "Test");

        return new ClaimsPrincipal(identity);
    }

    private async Task<TestUserContext> CreateUserAsync(bool isActive = true)
    {
        var userId = $"USER-{Guid.NewGuid().ToString("N")}";
        var email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var username = $"user_{Guid.NewGuid().ToString("N")[..8]}";
        const string password = "Aa1@abcd";

        var entity = new UserEntity
        {
            UserID = userId,
            Username = username,
            Email = email,
            PasswordHash = HashPassword(password),
            PhoneNumber = "0123456789",
            DisplayName = "Integration Tester",
            Dob = DateTime.UtcNow.Date,
            IsActive = isActive,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow
        };

        _db.Users.Add(entity);
        await _db.SaveChangesAsync();

        return new TestUserContext(userId, email, username, password);
    }

    private async Task CleanupUserAsync(TestUserContext user)
    {
        using var cleanupScope = _scopeFactory.CreateScope();
        var cleanupDb = cleanupScope.ServiceProvider.GetRequiredService<AppDbContext>();

        var addresses = await cleanupDb.Addresses.Where(a => a.UserID == user.UserId).ToListAsync();
        cleanupDb.Addresses.RemoveRange(addresses);

        var userRoles = await cleanupDb.UserRoles.Where(ur => ur.UserID == user.UserId).ToListAsync();
        cleanupDb.UserRoles.RemoveRange(userRoles);

        var tokens = await cleanupDb.RefreshTokens.Where(t => t.UserId == user.UserId).ToListAsync();
        cleanupDb.RefreshTokens.RemoveRange(tokens);

        var otps = await cleanupDb.UserOtps.Where(o => o.Email == user.Email).ToListAsync();
        cleanupDb.UserOtps.RemoveRange(otps);

        await cleanupDb.SaveChangesAsync();

        var entity = await cleanupDb.Users.FindAsync(user.UserId);
        if (entity != null)
        {
            cleanupDb.Users.Remove(entity);
            await cleanupDb.SaveChangesAsync();
        }
    }

    private async Task<Role> EnsureRoleAsync()
    {
        var role = new Role
        {
            Id = $"ROLE-{Guid.NewGuid().ToString("N")}",
            Name = $"Role_{Guid.NewGuid().ToString("N")[..6]}",
            Description = "Test role"
        };

        _db.Roles.Add(role);
        await _db.SaveChangesAsync();
        return role;
    }

    private async Task CleanupRoleAsync(string roleId)
    {
        using var cleanupScope = _scopeFactory.CreateScope();
        var cleanupDb = cleanupScope.ServiceProvider.GetRequiredService<AppDbContext>();

        var role = await cleanupDb.Roles.FindAsync(roleId);
        if (role == null)
        {
            return;
        }

        var userRoles = await cleanupDb.UserRoles.Where(ur => ur.RoleID == roleId).ToListAsync();
        cleanupDb.UserRoles.RemoveRange(userRoles);
        cleanupDb.Roles.Remove(role);
        await cleanupDb.SaveChangesAsync();
    }

    private async Task<Address> CreateAddressEntityAsync(string userId, string line1, string city)
    {
        var address = new Address
        {
            Id = $"ADR-{Guid.NewGuid().ToString("N")}",
            UserID = userId,
            Line1 = line1,
            City = city,
            Country = "Vietnam",
            PosttalCode = "700000",
            IsDefault = false
        };

        _db.Addresses.Add(address);
        await _db.SaveChangesAsync();
        return address;
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    private sealed record TestUserContext(string UserId, string Email, string Username, string PlainPassword);
}
