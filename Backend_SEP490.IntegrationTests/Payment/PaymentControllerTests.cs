using System.Net;
using System.Net.Http.Json;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Backend_SEP490.IntegrationTests.Payment;

[CollectionDefinition(nameof(PaymentControllerCollection), DisableParallelization = true)]
public sealed class PaymentControllerCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}

[Collection(nameof(PaymentControllerCollection))]
public class PaymentControllerTests
{
    private readonly CustomWebApplicationFactory<Program> _factory;

    public PaymentControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateVnpayPayment_Returns_Ok_When_Service_Succeeds()
    {
        var paymentResponse = new VnpayPaymentResponse
        {
            PaymentId = "PAY-123",
            OrderId = "ORD-456",
            OrderNumber = "SO-1",
            Amount = 150000,
            PaymentUrl = "https://sandbox.vnpay/transaction",
            QrContent = "data:image/png;base64,AAA=",
            ExpiredAt = DateTime.UtcNow.AddMinutes(5)
        };

        using var setup = CreateClientWithPaymentService(new FakePaymentService(
            createHandler: (_, _, _) => Task.FromResult<VnpayPaymentResponse?>(paymentResponse)));
        var client = setup.Client;

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/Payment/vnpay")
        {
            Content = JsonContent.Create(new CreateVnpayPaymentRequest
            {
                OrderId = "ORD-456",
                BankCode = "NCB"
            })
        };
        request.Headers.Add("X-Test-UserId", "USER-PAYMENT");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<VnpayPaymentResponse>();
        payload.Should().NotBeNull();
        payload!.PaymentId.Should().Be(paymentResponse.PaymentId);
        payload.PaymentUrl.Should().Be(paymentResponse.PaymentUrl);
    }

    [Fact]
    public async Task CreateVnpayPayment_Returns_BadRequest_When_Service_Returns_Null()
    {
        using var setup = CreateClientWithPaymentService(new FakePaymentService(
            createHandler: (_, _, _) => Task.FromResult<VnpayPaymentResponse?>(null)));
        var client = setup.Client;

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/Payment/vnpay")
        {
            Content = JsonContent.Create(new CreateVnpayPaymentRequest
            {
                OrderId = "ORD-999"
            })
        };
        request.Headers.Add("X-Test-UserId", "USER-PAYMENT");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateVnpayPayment_Returns_Unauthorized_When_User_Missing()
    {
        using var setup = CreateClientWithPaymentService(new FakePaymentService());
        var client = setup.Client;

        var response = await client.PostAsJsonAsync("/api/Payment/vnpay", new CreateVnpayPaymentRequest
        {
            OrderId = "ORD-000"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task HandleVnpayCallback_Redirects_To_Frontend_When_Success()
    {
        var callbackResult = new VnpayCallbackResult
        {
            Success = true,
            Status = "Paid",
            PaymentId = "PAY-REDIRECT"
        };

        using var setup = CreateClientWithPaymentService(new FakePaymentService(
            callbackHandler: _ => Task.FromResult(callbackResult)));
        var options = new WebApplicationFactoryClientOptions { AllowAutoRedirect = false };
        var client = setup.Factory.CreateClient(options);

        var response = await client.GetAsync("/api/Payment/vnpay/callback?vnp_ResponseCode=00");

        response.StatusCode.Should().Be(HttpStatusCode.Redirect);
        response.Headers.Location.Should().NotBeNull();
        response.Headers.Location!.ToString().Should().Be("https://frontend.test/payment-result?vnp_ResponseCode=00");
    }

    [Fact]
    public async Task HandleVnpayCallback_Returns_BadRequest_When_Service_Fails()
    {
        var callbackResult = new VnpayCallbackResult
        {
            Success = false,
            Status = "Failed",
            Message = "Invalid signature"
        };

        using var setup = CreateClientWithPaymentService(new FakePaymentService(
            callbackHandler: _ => Task.FromResult(callbackResult)));
        var client = setup.Client;

        var response = await client.GetAsync("/api/Payment/vnpay/callback?vnp_ResponseCode=99");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var payload = await response.Content.ReadFromJsonAsync<VnpayCallbackResult>();
        payload.Should().NotBeNull();
        payload!.Status.Should().Be("Failed");
    }

    [Fact]
    public async Task UpdateStatus_Returns_Ok_When_Admin_And_Service_Succeeds()
    {
        using var setup = CreateClientWithPaymentService(new FakePaymentService(
            updateStatusHandler: _ => Task.FromResult("Status updated successfully")));
        var client = setup.Client;

        var request = new UpdatePaymentStatusRequest
        {
            PaymentId = "PAY-000",
            Status = "Paid"
        };

        var httpRequest = new HttpRequestMessage(HttpMethod.Put, "/api/Payment/status")
        {
            Content = JsonContent.Create(request)
        };
        httpRequest.Headers.Add("X-Test-UserId", "ADMIN-USER");
        httpRequest.Headers.Add("X-Test-Roles", "Admin");

        var response = await client.SendAsync(httpRequest);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var message = await response.Content.ReadAsStringAsync();
        message.Should().Contain("updated", StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UpdateStatus_Returns_BadRequest_When_Service_Errors()
    {
        using var setup = CreateClientWithPaymentService(new FakePaymentService(
            updateStatusHandler: _ => Task.FromResult("Payment not found")));
        var client = setup.Client;

        var request = new HttpRequestMessage(HttpMethod.Put, "/api/Payment/status")
        {
            Content = JsonContent.Create(new UpdatePaymentStatusRequest
            {
                PaymentId = "PAY-404",
                Status = "Failed"
            })
        };
        request.Headers.Add("X-Test-UserId", "ADMIN-USER");
        request.Headers.Add("X-Test-Roles", "Admin");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateStatus_Returns_Forbidden_For_Non_Admin()
    {
        using var setup = CreateClientWithPaymentService(new FakePaymentService(
            updateStatusHandler: _ => Task.FromResult("Status updated successfully")));
        var client = setup.Client;

        var request = new HttpRequestMessage(HttpMethod.Put, "/api/Payment/status")
        {
            Content = JsonContent.Create(new UpdatePaymentStatusRequest
            {
                PaymentId = "PAY-001",
                Status = "Paid"
            })
        };
        request.Headers.Add("X-Test-UserId", "USER-NOT-ADMIN");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private TestClientContext CreateClientWithPaymentService(IPaymentService paymentService)
    {
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IPaymentService>();
                services.AddSingleton(paymentService);
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

    private sealed class FakePaymentService : IPaymentService
    {
        private readonly Func<string, CreateVnpayPaymentRequest, string, Task<VnpayPaymentResponse?>> _create;
        private readonly Func<IQueryCollection, Task<VnpayCallbackResult>> _callback;
        private readonly Func<UpdatePaymentStatusRequest, Task<string>> _updateStatus;

        public FakePaymentService(
            Func<string, CreateVnpayPaymentRequest, string, Task<VnpayPaymentResponse?>>? createHandler = null,
            Func<IQueryCollection, Task<VnpayCallbackResult>>? callbackHandler = null,
            Func<UpdatePaymentStatusRequest, Task<string>>? updateStatusHandler = null)
        {
            _create = createHandler ?? ((_, _, _) => Task.FromResult<VnpayPaymentResponse?>(null));
            _callback = callbackHandler ?? (_ => Task.FromResult(new VnpayCallbackResult { Success = false }));
            _updateStatus = updateStatusHandler ?? (_ => Task.FromResult(string.Empty));
        }

        public Task<VnpayPaymentResponse?> CreateVnpayPaymentAsync(string userId, CreateVnpayPaymentRequest request, string clientIp) =>
            _create(userId, request, clientIp);

        public Task<VnpayCallbackResult> HandleVnpayCallbackAsync(IQueryCollection queryCollection) =>
            _callback(queryCollection);

        public Task<string> UpdatePaymentStatusAsync(UpdatePaymentStatusRequest request) =>
            _updateStatus(request);
    }
}
