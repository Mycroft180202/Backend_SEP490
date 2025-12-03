using AutoMapper;
using Backend_SEP490.Config;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace Backend_SEP490.UnitTests
{
    public class PaymentServiceUnitTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IPaymentRepository> _paymentRepoMock;
        private readonly Mock<IOrderService> _orderServiceMock;
        private readonly Mock<IVoucherService> _voucherServiceMock;
        private readonly Mock<INotificationService> _notificationServiceMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<ILogger<PaymentServiceImpl>> _loggerMock;
        private readonly PaymentServiceImpl _service;
        private readonly VnpaySettings _vnpaySettings;

        public PaymentServiceUnitTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _paymentRepoMock = new Mock<IPaymentRepository>();
            _unitOfWorkMock.Setup(u => u.Payments).Returns(_paymentRepoMock.Object);

            _orderServiceMock = new Mock<IOrderService>();
            _voucherServiceMock = new Mock<IVoucherService>();
            _notificationServiceMock = new Mock<INotificationService>();
            _mapperMock = new Mock<IMapper>();
            _loggerMock = new Mock<ILogger<PaymentServiceImpl>>();

            _vnpaySettings = new VnpaySettings
            {
                PaymentUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
                TmnCode = "TESTCODE",
                HashSecret = "TESTSECRET",
                ReturnUrl = "https://localhost/callback",
                DefaultBankCode = "NCB",
                ExpireMinutes = 15,
                Version = "2.1.0",
                Command = "pay",
                CurrencyCode = "VND",
                Locale = "vn"
            };

            var optionsMock = new Mock<IOptions<VnpaySettings>>();
            optionsMock.Setup(o => o.Value).Returns(_vnpaySettings);

            _service = new PaymentServiceImpl(
                _mapperMock.Object,
                _unitOfWorkMock.Object,
                _notificationServiceMock.Object,
                _orderServiceMock.Object,
                _voucherServiceMock.Object,
                optionsMock.Object,
                _loggerMock.Object
            );
        }

        // -----------------------------
        // CreateVnpayPaymentAsync
        // -----------------------------

        [Fact]
        public async Task CreateVnpayPaymentAsync_ReturnsNull_WhenUserIdIsNull()
        {
            var result = await _service.CreateVnpayPaymentAsync(null!, new CreateVnpayPaymentRequest(), "127.0.0.1");
            Assert.Null(result);
        }

        [Fact]
        public async Task CreateVnpayPaymentAsync_ReturnsNull_WhenOrderNotFound()
        {
            _unitOfWorkMock.Setup(u => u.Order.GetAllOrderByIdAsync("ORD1")).ReturnsAsync((Order?)null);
            var request = new CreateVnpayPaymentRequest { OrderId = "ORD1" };

            var result = await _service.CreateVnpayPaymentAsync("U1", request, "127.0.0.1");

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateVnpayPaymentAsync_ReturnsNull_WhenOrderNotBelongToUser()
        {
            var order = new Order { Id = "ORD1", CustomerId = "U2", PaymentType = "VNPAY", TotalAmount = 100 };
            _unitOfWorkMock.Setup(u => u.Order.GetAllOrderByIdAsync("ORD1")).ReturnsAsync(order);
            var request = new CreateVnpayPaymentRequest { OrderId = "ORD1" };

            var result = await _service.CreateVnpayPaymentAsync("U1", request, "127.0.0.1");

            Assert.Null(result);
        }

        // -----------------------------
        // HandleVnpayCallbackAsync
        // -----------------------------

        [Fact]
        public async Task HandleVnpayCallbackAsync_ReturnsFailed_WhenQueryCollectionIsEmpty()
        {
            var queryCollection = new QueryCollection();
            var result = await _service.HandleVnpayCallbackAsync(queryCollection);
            Assert.False(result.Success);
            Assert.Equal("Invalid payment data.", result.Message);
        }

        [Fact]
        public async Task HandleVnpayCallbackAsync_ReturnsFailed_WhenPaymentNotFound()
        {
            var queryCollection = new QueryCollection(new Dictionary<string, Microsoft.Extensions.Primitives.StringValues>
            {
                ["vnp_TxnRef"] = "PAY1",
                ["vnp_ResponseCode"] = "00",
                ["vnp_SecureHash"] = "HASH"
            });

            _paymentRepoMock.Setup(p => p.FindByIdAsync("PAY1")).ReturnsAsync((Payment?)null);

            var result = await _service.HandleVnpayCallbackAsync(queryCollection);
            Assert.False(result.Success);
            Assert.Equal("Invalid signature.", result.Message);
        }

        // -----------------------------
        // Helper method tests
        // -----------------------------

        [Fact]
        public void ComputeHmac_ReturnsNonEmptyHash()
        {
            var method = typeof(PaymentServiceImpl).GetMethod("ComputeHmac", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var result = method!.Invoke(null, new object[] { "secret", "data" }) as string;
            Assert.False(string.IsNullOrWhiteSpace(result));
        }

        [Fact]
        public void GenerateQrContent_ReturnsBase64_WhenInputNotEmpty()
        {
            var method = typeof(PaymentServiceImpl).GetMethod("GenerateQrContent", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var result = method!.Invoke(null, new object[] { "https://test.com" }) as string;
            Assert.Contains("data:image/png;base64,", result!);
        }

        [Fact]
        public void GenerateQrContent_ReturnsEmpty_WhenInputEmpty()
        {
            var method = typeof(PaymentServiceImpl).GetMethod("GenerateQrContent", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var result = method!.Invoke(null, new object[] { "" }) as string;
            Assert.Equal(string.Empty, result);
        }
    }
}
