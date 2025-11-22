using Backend_SEP490.Config;
using Backend_SEP490.Services.impl;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using System.Net;
using System.Text;

namespace Backend_SEP490.UnitTests
{
    public class GhnMasterDataUnitTests
    {
        private readonly Mock<HttpMessageHandler> _handlerMock;
        private readonly HttpClient _httpClient;
        private readonly Mock<IOptions<GhnSettings>> _optionsMock;
        private readonly Mock<ILogger<GhnMasterDataService>> _loggerMock;
        private readonly GhnMasterDataService _service;

        private const string ValidToken = "test-token-123";
        private const int ValidShopId = 12345;

        public GhnMasterDataUnitTests()
        {
            _handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
            _httpClient = new HttpClient(_handlerMock.Object)
            {
                BaseAddress = new Uri("https://online-gateway.ghn.vn/")
            };

            var settings = new GhnSettings { Token = ValidToken, ShopId = ValidShopId };
            _optionsMock = new Mock<IOptions<GhnSettings>>();
            _optionsMock.Setup(o => o.Value).Returns(settings);

            _loggerMock = new Mock<ILogger<GhnMasterDataService>>();

            _service = new GhnMasterDataService(_httpClient, _optionsMock.Object, _loggerMock.Object);
        }

        // ==================================================================
        // SUCCESS CASES
        // ==================================================================

        [Fact(DisplayName = "GetProvincesAsync - Returns provinces when API success")]
        public async Task GetProvincesAsync_Success_ReturnsProvinces()
        {
            var jsonResponse = """
                {
                    "code": 200,
                    "message": "Success",
                    "data": [
                        { "ProvinceID": 201, "ProvinceName": "Hà Nội" },
                        { "ProvinceID": 202, "ProvinceName": "TP. Hồ Chí Minh" }
                    ]
                }
                """;

            SetupSuccessfulResponse("/shiip/public-api/master-data/province", "{}", jsonResponse);

            var result = await _service.GetProvincesAsync();

            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
            Assert.Contains(result, p => p.ProvinceName == "Hà Nội");
        }

        [Fact(DisplayName = "GetDistrictsAsync - Returns districts for valid province")]
        public async Task GetDistrictsAsync_Success_ReturnsDistricts()
        {
            var jsonResponse = """
                {
                    "code": 200,
                    "data": [
                        { "DistrictID": 1442, "DistrictName": "Quận Ba Đình", "ProvinceID": 201 }
                    ]
                }
                """;

            SetupSuccessfulResponse("/shiip/public-api/master-data/district", "{\"province_id\":201}", jsonResponse);

            var result = await _service.GetDistrictsAsync(201);

            Assert.Single(result);
            Assert.Equal("Quận Ba Đình", result.First().DistrictName);
        }

        [Fact(DisplayName = "GetWardsAsync - Returns wards for valid district")]
        public async Task GetWardsAsync_Success_ReturnsWards()
        {
            var jsonResponse = """
                {
                    "code": 200,
                    "data": [
                        { "WardCode": "00123", "WardName": "Phường Trúc Bạch", "DistrictID": 1442 }
                    ]
                }
                """;

            SetupSuccessfulResponse("/shiip/public-api/master-data/ward", "{\"district_id\":1442}", jsonResponse);

            var result = await _service.GetWardsAsync(1442);

            Assert.Single(result);
            Assert.Equal("00123", result.First().WardCode);
        }

        // ==================================================================
        // FAILURE & EDGE CASES
        // ==================================================================

        [Fact(DisplayName = "GetProvincesAsync - Non-200 status → Returns empty")]
        public async Task GetProvincesAsync_NonSuccess_ReturnsEmpty()
        {
            SetupResponse(HttpStatusCode.Unauthorized, "/shiip/public-api/master-data/province", "{}", "{ \"code\": 401, \"message\": \"Unauthorized\" }");

            var result = await _service.GetProvincesAsync();

            Assert.Empty(result);
        }

        [Fact(DisplayName = "GetProvincesAsync - Missing data field → Returns empty")]
        public async Task GetProvincesAsync_MissingData_ReturnsEmpty()
        {
            SetupResponse(HttpStatusCode.OK, "/shiip/public-api/master-data/province", "{}", "{ \"code\": 200, \"message\": \"Success\" }");

            var result = await _service.GetProvincesAsync();

            Assert.Empty(result);
        }

        [Fact(DisplayName = "GetProvincesAsync - Network exception → Returns empty")]
        public async Task GetProvincesAsync_NetworkError_ReturnsEmpty()
        {
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ThrowsAsync(new HttpRequestException("No connection"));

            var result = await _service.GetProvincesAsync();

            Assert.Empty(result);
        }

        [Fact(DisplayName = "GetProvincesAsync - Request timeout → Returns empty")]
        public async Task GetProvincesAsync_Timeout_ReturnsEmpty()
        {
            var cts = new CancellationTokenSource();
            cts.Cancel();

            var result = await _service.GetProvincesAsync(cts.Token);

            Assert.Empty(result);
        }

        private void SetupSuccessfulResponse(string relativeUri, string expectedPayload, string jsonResponse)
            => SetupResponse(HttpStatusCode.OK, relativeUri, expectedPayload, jsonResponse);

        private void SetupResponse(HttpStatusCode statusCode, string relativeUri, string expectedPayload, string jsonResponse)
        {
            _handlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req =>
                        req.Method == HttpMethod.Post &&
                        req.RequestUri!.ToString().EndsWith(relativeUri) &&
                        PayloadMatches(req, expectedPayload)),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage(statusCode)
                {
                    Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
                })
                .Verifiable();
        }

        private static bool PayloadMatches(HttpRequestMessage req, string expectedPayload)
        {
            if (req.Content == null) return string.IsNullOrEmpty(expectedPayload);
            var actual = req.Content.ReadAsStringAsync(CancellationToken.None).GetAwaiter().GetResult();
            return actual == expectedPayload;
        }
    }
}