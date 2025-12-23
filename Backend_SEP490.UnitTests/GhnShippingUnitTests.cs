using Backend_SEP490.Config;
using Backend_SEP490.DTOs.External.Ghn;
using Backend_SEP490.Models;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Backend_SEP490.UnitTests
{
    public class GhnShippingUnitTests
    {
        private readonly Mock<HttpMessageHandler> _handlerMock;
        private readonly HttpClient _httpClient;
        private readonly Mock<IOptions<GhnSettings>> _optionsMock;
        private readonly Mock<ILogger<GhnShippingService>> _loggerMock;
        private readonly GhnShippingService _service;

        private const string ValidToken = "valid-token-123";
        private const int ValidShopId = 123456;

        public GhnShippingUnitTests()
        {
            _handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            _httpClient = new HttpClient(_handlerMock.Object)
            {
                BaseAddress = new Uri("https://online-gateway.ghn.vn/")
            };

            var settings = new GhnSettings
            {
                Token = ValidToken,
                ShopId = ValidShopId,
                FromDistrictId = 1442,
                FromWardCode = "11007",
                DefaultToDistrictId = 1450,
                DefaultToWardCode = "12009",
                FromName = "My Shop",
                FromPhone = "0901234567",
                FromAddress = "123 Đường Láng, Hà Nội",
                DefaultItemWeight = 500,
                DefaultParcelLength = 30,
                DefaultParcelWidth = 20,
                DefaultParcelHeight = 10,
                ServiceTypeId = 2,
                PaymentTypeId = 2
            };

            _optionsMock = new Mock<IOptions<GhnSettings>>();
            _optionsMock.Setup(o => o.Value).Returns(settings);

            _loggerMock = new Mock<ILogger<GhnShippingService>>();

            _service = new GhnShippingService(_httpClient, _optionsMock.Object, _loggerMock.Object);
        }

        // ==================================================================
        // CREATE SHIPPING ORDER - SUCCESS
        // ==================================================================

        [Fact(DisplayName = "CreateShippingOrderAsync - Valid order → Returns GHN response with order code")]
        public async Task CreateShippingOrderAsync_ValidOrder_ReturnsSuccessResponse()
        {
            var order = new Order { Id = "ORD001", OrderNumber = "ORD2025001", TotalAmount = 500000, CustomerId = "U1" };
            var orderItems = new List<OrderItem>
            {
                new OrderItem { ProductID = "P1", Quantity = 2, UnitPrice = 250000 }
            };
            var address = new Address { Line1 = "456 Nguyễn Trãi", City = "TP. Hồ Chí Minh" };
            var customer = new User { DisplayName = "Nguyễn Văn A", PhoneNumber = "0912345678" };
            var products = new List<Product>
            {
                new Product { Id = "P1", Name = "Handmade Vase" }
            };

            var ghnResponse = """
                {
                    "code": 200,
                    "data": {
                        "order_code": "GHN123456789",
                        "total_fee": 35000
                    },
                    "message": "Success"
                }
                """;

            SetupJsonResponse("/shiip/public-api/v2/shipping-order/create", ghnResponse);

            var result = await _service.CreateShippingOrderAsync(order, orderItems, address, customer, null, products);

            Assert.NotNull(result);
            Assert.Equal(200, result.Code);
            Assert.Equal("GHN123456789", result.Data?.OrderCode);
        }

        // ==================================================================
        // FAILURE CASES
        // ==================================================================

        [Fact(DisplayName = "CreateShippingOrderAsync - Missing Token/ShopId → Returns null + logs warning")]
        public async Task CreateShippingOrderAsync_MissingSettings_ReturnsNull()
        {
            var badSettings = new GhnSettings { Token = "", ShopId = 0 };
            var badOptions = new Mock<IOptions<GhnSettings>>();
            badOptions.Setup(o => o.Value).Returns(badSettings);
            var badService = new GhnShippingService(_httpClient, badOptions.Object, _loggerMock.Object);

            var result = await badService.CreateShippingOrderAsync(
                new Order(), Enumerable.Empty<OrderItem>(), new Address(), new User(), null, Enumerable.Empty<Product>());

            Assert.Null(result);

            // ĐÃ SỬA: Dùng Moq Verify chuẩn, không cần helper
            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("GHN settings are missing")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact(DisplayName = "CreateShippingOrderAsync - No items → Returns null + logs warning")]
        public async Task CreateShippingOrderAsync_NoItems_ReturnsNull()
        {
            var result = await _service.CreateShippingOrderAsync(
                new Order { Id = "ORD001" },
                Enumerable.Empty<OrderItem>(),
                new Address(),
                new User(),
                null,
                Enumerable.Empty<Product>());

            Assert.Null(result);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("does not contain any items")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact(DisplayName = "CreateShippingOrderAsync - API returns error → Returns response with error code")]
        public async Task CreateShippingOrderAsync_ApiError_ReturnsErrorResponse()
        {
            SetupJsonResponse("/shiip/public-api/v2/shipping-order/create", "{ \"code\": 400, \"message\": \"Invalid ward code\" }");

            var result = await _service.CreateShippingOrderAsync(
                new Order { Id = "ORD001" },
                new List<OrderItem> { new OrderItem { ProductID = "P1", Quantity = 1 } },
                new Address(),
                new User(),
                null,
                new List<Product> { new Product { Id = "P1" } });

            Assert.NotNull(result);
            Assert.Equal(400, result.Code);
        }

        // ==================================================================
        // CANCEL ORDER
        // ==================================================================

        //[Fact(DisplayName = "CancelOrderAsync - Valid order code → Returns true")]
        //public async Task CancelOrderAsync_ValidOrderCode_ReturnsTrue()
        //{
        //    SetupJsonResponse("/shiip/public-api/v2/shipping-order/cancel", "{ \"code\": 200, \"message\": \"Success\" }");

        //    var result = await _service.CancelOrderAsync(orderCode: "GHN123456789");

        //    Assert.True(result);
        //}

        [Fact(DisplayName = "CancelOrderAsync - Invalid codes → Returns false + logs warning")]
        public async Task CancelOrderAsync_NoCodes_ReturnsFalse()
        {
            var result = await _service.CancelOrderAsync(orderCode: null, clientOrderCode: null);

            Assert.False(result);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("both order code and client order code are empty")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        // ==================================================================
        // CALCULATE FEE
        // ==================================================================

        [Fact(DisplayName = "CalculateShippingFeeAsync - Valid request → Returns fee")]
        public async Task CalculateShippingFeeAsync_Valid_ReturnsFee()
        {
            var response = """
                {
                    "code": 200,
                    "data": {
                        "service_fee": 35000,
                        "total": 40000
                    }
                }
                """;

            SetupJsonResponse("/shiip/public-api/v2/shipping-order/fee", response);

            var request = new GhnCalculateFeeRequest
            {
                ToDistrictId = 1450,
                ToWardCode = "12009",
                Weight = 1000
            };

            var result = await _service.CalculateShippingFeeAsync(request);

            Assert.NotNull(result);
            Assert.Equal(200, result.Code);
            Assert.Equal(40000, result.Data?.Total);
        }

        // ==================================================================
        // HEADER VERIFICATION
        // ==================================================================

        //[Fact(DisplayName = "All requests include correct Token and ShopId headers")]
        //public async Task AllRequests_IncludeCorrectHeaders()
        //{
        //    SetupJsonResponse("/shiip/public-api/v2/shipping-order/create", "{ \"code\": 200, \"data\": { \"order_code\": \"TEST123\" } }");

        //    await _service.CreateShippingOrderAsync(
        //        new Order { Id = "O1" },
        //        new List<OrderItem> { new OrderItem { ProductID = "P1", Quantity = 1 } },
        //        new Address(),
        //        new User(),
        //        null,
        //        new List<Product> { new Product { Id = "P1" } });

        //    _handlerMock.Protected().Verify(
        //        "SendAsync",
        //        Times.Once(),
        //        ItExpr.Is<HttpRequestMessage>(req =>
        //            req.Headers.TryGetValues("Token", out var tokens) && tokens.Contains(ValidToken) &&
        //            req.Headers.TryGetValues("ShopId", out var shopIds) && shopIds.Contains(ValidShopId.ToString())),
        //        ItExpr.IsAny<CancellationToken>());
        //}


        private void SetupJsonResponse(string relativeUri, string jsonResponse)
        {
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req =>
                        req.Method == HttpMethod.Post &&
                        req.RequestUri!.ToString().EndsWith(relativeUri) &&
                        PayloadMatches(req)),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
                })
                .Verifiable();
        }

        private static bool PayloadMatches(HttpRequestMessage req)
        {
            if (req.Content == null) return true;
            var json = req.Content.ReadAsStringAsync(CancellationToken.None).GetAwaiter().GetResult();
            return !string.IsNullOrEmpty(json);
        }
    }
}