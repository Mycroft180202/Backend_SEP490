using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Backend_SEP490.IntegrationTests.Notification;

[CollectionDefinition(nameof(NotificationControllerCollection), DisableParallelization = true)]
public sealed class NotificationControllerCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}

[Collection(nameof(NotificationControllerCollection))]
public class NotificationControllerTests
{
    private readonly CustomWebApplicationFactory<Program> _factory;

    public NotificationControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetNotifications_Returns_Ok_With_Payload()
    {
        var expected = new PagedResult<ResponseNotificationDto>
        {
            Items = new[]
            {
                new ResponseNotificationDto
                {
                    Id = "NOTI-1",
                    Message = "Hello",
                    Title = "Greeting",
                    Type = "INFO",
                    IsRead = false,
                    CreatedDate = DateTime.UtcNow
                }
            },
            TotalCount = 1,
            PageIndex = 1,
            PageSize = 10
        };

        var fakeService = new FakeNotificationService(
            getHandler: (userId, filter) =>
            {
                userId.Should().Be("USER-NOTI");
                filter.PageIndex.Should().Be(2);
                filter.PageSize.Should().Be(5);
                return Task.FromResult(expected);
            });

        using var setup = CreateClientWithNotificationService(fakeService);
        var client = setup.Client;

        var request = new HttpRequestMessage(HttpMethod.Get, "/api/Notification?PageIndex=2&PageSize=5");
        request.Headers.Add("X-Test-UserId", "USER-NOTI");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<PagedResult<ResponseNotificationDto>>();
        payload.Should().NotBeNull();
        payload!.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetNotifications_Returns_Unauthorized_When_User_Missing()
    {
        using var setup = CreateClientWithNotificationService(new FakeNotificationService());
        var client = setup.Client;

        var response = await client.GetAsync("/api/Notification");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task MarkAsRead_Returns_NoContent_When_Updated()
    {
        var fakeService = new FakeNotificationService(
            markAsReadHandler: (_, _) => Task.FromResult(true));
        using var setup = CreateClientWithNotificationService(fakeService);
        var client = setup.Client;

        var request = new HttpRequestMessage(HttpMethod.Put, "/api/Notification/NOTI-2/read");
        request.Headers.Add("X-Test-UserId", "USER-NOTI");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task MarkAsRead_Returns_NotFound_When_Not_Updated()
    {
        var fakeService = new FakeNotificationService(
            markAsReadHandler: (_, _) => Task.FromResult(false));
        using var setup = CreateClientWithNotificationService(fakeService);
        var client = setup.Client;

        var request = new HttpRequestMessage(HttpMethod.Put, "/api/Notification/NOTI-404/read");
        request.Headers.Add("X-Test-UserId", "USER-NOTI");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task MarkAllAsRead_Returns_Count()
    {
        var fakeService = new FakeNotificationService(
            markAllHandler: _ => Task.FromResult(3));
        using var setup = CreateClientWithNotificationService(fakeService);
        var client = setup.Client;

        var request = new HttpRequestMessage(HttpMethod.Put, "/api/Notification/mark-all-read");
        request.Headers.Add("X-Test-UserId", "USER-NOTI");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.GetProperty("updated").GetInt32().Should().Be(3);
    }

    [Fact]
    public async Task DeleteNotification_Returns_NoContent_When_Removed()
    {
        var fakeService = new FakeNotificationService(
            removeHandler: (_, _) => Task.FromResult(true));
        using var setup = CreateClientWithNotificationService(fakeService);
        var client = setup.Client;

        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/Notification/NOTI-DEL");
        request.Headers.Add("X-Test-UserId", "USER-NOTI");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteNotification_Returns_NotFound_When_Service_Returns_False()
    {
        var fakeService = new FakeNotificationService(
            removeHandler: (_, _) => Task.FromResult(false));
        using var setup = CreateClientWithNotificationService(fakeService);
        var client = setup.Client;

        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/Notification/NOTI-DEL");
        request.Headers.Add("X-Test-UserId", "USER-NOTI");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AdminSend_Returns_Ok_When_Service_Succeeds()
    {
        var fakeService = new FakeNotificationService(
            adminSendHandler: (_, _) => Task.CompletedTask);
        using var setup = CreateClientWithNotificationService(fakeService);
        var client = setup.Client;

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/Notification/admin/send")
        {
            Content = JsonContent.Create(new AdminSendNotificationRequest
            {
                TargetUserId = "USER-TARGET",
                Message = "Please review your order",
                Type = "ALERT"
            })
        };
        request.Headers.Add("X-Test-UserId", "ADMIN-USER");
        request.Headers.Add("X-Test-Roles", "Admin");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task AdminSend_Returns_Forbidden_When_User_Not_Admin()
    {
        var fakeService = new FakeNotificationService(
            adminSendHandler: (_, _) => Task.CompletedTask);
        using var setup = CreateClientWithNotificationService(fakeService);
        var client = setup.Client;

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/Notification/admin/send")
        {
            Content = JsonContent.Create(new AdminSendNotificationRequest
            {
                TargetUserId = "USER-TARGET",
                Message = "Message",
                Type = "INFO"
            })
        };
        request.Headers.Add("X-Test-UserId", "USER-NOT-ADMIN");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task AdminSend_Returns_NotFound_When_Service_Throws_InvalidOperation()
    {
        var fakeService = new FakeNotificationService(
            adminSendHandler: (_, _) => throw new InvalidOperationException("Missing target"));
        using var setup = CreateClientWithNotificationService(fakeService);
        var client = setup.Client;

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/Notification/admin/send")
        {
            Content = JsonContent.Create(new AdminSendNotificationRequest
            {
                TargetUserId = "USER-MISSING",
                Message = "Hello",
                Type = "INFO"
            })
        };
        request.Headers.Add("X-Test-UserId", "ADMIN-USER");
        request.Headers.Add("X-Test-Roles", "Admin");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private TestClientContext CreateClientWithNotificationService(INotificationService service)
    {
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<INotificationService>();
                services.AddSingleton(service);
            });
        });

        return new TestClientContext(factory, factory.CreateClient());
    }

    private sealed class TestClientContext : IDisposable
    {
        public WebApplicationFactory<Program> Factory { get; }
        public HttpClient Client { get; }

        public TestClientContext(WebApplicationFactory<Program> factory, HttpClient client)
        {
            Factory = factory;
            Client = client;
        }

        public void Dispose()
        {
            Client.Dispose();
            Factory.Dispose();
        }
    }

    private sealed class FakeNotificationService : INotificationService
    {
        private readonly Func<string, NotificationFilterRequest, Task<PagedResult<ResponseNotificationDto>>> _getNotifications;
        private readonly Func<string, string, Task<bool>> _markAsRead;
        private readonly Func<string, Task<int>> _markAll;
        private readonly Func<string, string, Task<bool>> _remove;
        private readonly Func<string, AdminSendNotificationRequest, Task> _adminSend;

        public FakeNotificationService(
            Func<string, NotificationFilterRequest, Task<PagedResult<ResponseNotificationDto>>>? getHandler = null,
            Func<string, string, Task<bool>>? markAsReadHandler = null,
            Func<string, Task<int>>? markAllHandler = null,
            Func<string, string, Task<bool>>? removeHandler = null,
            Func<string, AdminSendNotificationRequest, Task>? adminSendHandler = null)
        {
            _getNotifications = getHandler ?? ((_, _) => Task.FromResult(new PagedResult<ResponseNotificationDto>
            {
                Items = Array.Empty<ResponseNotificationDto>(),
                PageIndex = 1,
                PageSize = 10,
                TotalCount = 0
            }));
            _markAsRead = markAsReadHandler ?? ((_, _) => Task.FromResult(true));
            _markAll = markAllHandler ?? (_ => Task.FromResult(0));
            _remove = removeHandler ?? ((_, _) => Task.FromResult(true));
            _adminSend = adminSendHandler ?? ((_, _) => Task.CompletedTask);
        }

        public Task<PagedResult<ResponseNotificationDto>> GetNotificationsAsync(string userId, NotificationFilterRequest request) =>
            _getNotifications(userId, request);

        public Task<bool> MarkAsReadAsync(string userId, string notificationId) =>
            _markAsRead(userId, notificationId);

        public Task<int> MarkAllAsReadAsync(string userId) =>
            _markAll(userId);

        public Task<bool> RemoveAsync(string userId, string notificationId) =>
            _remove(userId, notificationId);

        public Task AdminSendNotificationAsync(string adminId, AdminSendNotificationRequest request) =>
            _adminSend(adminId, request);

        public Task NotifyOrderCreatedAsync(Order order, IReadOnlyCollection<OrderItem> orderItems, IReadOnlyDictionary<string, Product> productLookup) =>
            Task.CompletedTask;

        public Task NotifyArtisanFeedbackAsync(Product product, User customer, RequestDTOFeedback feedback) =>
            Task.CompletedTask;

        public Task NotifyPromotionAsync(Voucher voucher) => Task.CompletedTask;

        public Task NotifyVoucherGrantedAsync(string userId, Voucher voucher, string? customMessage) => Task.CompletedTask;

        public Task NotifyVoucherEventExpiringAsync(Voucher voucher, IEnumerable<string> userIds) => Task.CompletedTask;

        public Task NotifyAdminsProductReportedAsync(Report report, Product product, User reporter) => Task.CompletedTask;

        public Task NotifyPaymentStatusAsync(Payment payment, string customerId, string? orderNumber) => Task.CompletedTask;

        public Task NotifyArtisanApplicationSubmittedAsync(ArtisanApplication application, User applicant) => Task.CompletedTask;

        public Task NotifyArtisanApplicationReviewedAsync(ArtisanApplication application, User applicant) => Task.CompletedTask;
    }
}
