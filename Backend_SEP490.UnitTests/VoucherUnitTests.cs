using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using Moq;
using System;
using System.Threading.Tasks;
using Xunit;

namespace Backend_SEP490.UnitTests
{
    public class VoucherUnitTests
    {
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _uowMock;
        private readonly Mock<IVoucherRepositories> _voucherRepoMock;
        private readonly Mock<INotificationService> _notificationServiceMock;
        private readonly VoucherServiceImpl _service;

        public VoucherUnitTests()
        {
            _mapperMock = new Mock<IMapper>();
            _uowMock = new Mock<IUnitOfWork>();
            _voucherRepoMock = new Mock<IVoucherRepositories>();
            _notificationServiceMock = new Mock<INotificationService>();

            // Cấu hình UnitOfWork trả về repo mock
            _uowMock.Setup(u => u.Voucher).Returns(_voucherRepoMock.Object);

            // Tạo service ĐẦY ĐỦ constructor (bắt buộc có INotificationService)
            _service = new VoucherServiceImpl(
                _mapperMock.Object,
                _uowMock.Object,
                _notificationServiceMock.Object);
        }

        // ----------------------------
        // CreateVoucherAsync
        // ----------------------------
        [Fact(DisplayName = "CreateVoucherAsync - Normal case - Returns success + Notify")]
        public async Task CreateVoucherAsync_Success_ShouldNotify()
        {
            // Arrange
            var userId = "U001";
            var request = new RequestCreateVoucher
            {
                Code = "SUMMER2025",
                Description = "Summer sale",
                DiscountType = "Percent",
                DiscountValue = 20,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(30),
                IsActive = true
            };

            _voucherRepoMock.Setup(r => r.GetVoucherByCodeAsync(request.Code))
                .ReturnsAsync((Voucher)null);

            _voucherRepoMock.Setup(r => r.CreateVoucherAsync(It.IsAny<Voucher>()))
                .ReturnsAsync("Create voucher successfully!");

            // Act
            var result = await _service.CreateVoucherAsync(userId, request);

            // Assert
            Assert.Equal("Create voucher successfully!", result);
            _voucherRepoMock.Verify(r => r.CreateVoucherAsync(It.IsAny<Voucher>()), Times.Once);
            _notificationServiceMock.Verify(n => n.NotifyPromotionAsync(It.IsAny<Voucher>()), Times.Once);
        }

        //[Fact(DisplayName = "CreateVoucherAsync - Code already exists - Returns error")]
        //public async Task CreateVoucherAsync_CodeExists_ReturnsError()
        //{
        //    // Arrange
        //    var request = new RequestCreateVoucher { Code = "EXISTING" };
        //    _voucherRepoMock.Setup(r => r.GetVoucherByCodeAsync(request.Code))
        //        .ReturnsAsync(new Voucher { Code = "EXISTING" });

        //    // Act
        //    var result = await _service.CreateVoucherAsync("U001", request);

        //    // Assert
        //    Assert.Equal("Voucher Code is already exist!", result);
        //    _voucherRepoMock.Verify(r => r.CreateVoucherAsync(It.IsAny<Voucher>()), Times.Never);
        //}

        [Theory(DisplayName = "CreateVoucherAsync - Invalid userId should NOT throw (service accepts null)")]
        [InlineData(null)]
        [InlineData("")]
        public async Task CreateVoucherAsync_InvalidUserId_Accepted(string userId)
        {
            // Arrange
            var request = new RequestCreateVoucher { Code = "TEST123" };
            _voucherRepoMock.Setup(r => r.GetVoucherByCodeAsync(request.Code)).ReturnsAsync((Voucher)null);
            _voucherRepoMock.Setup(r => r.CreateVoucherAsync(It.IsAny<Voucher>())).ReturnsAsync("Create voucher successfully!");

            // Act
            var result = await _service.CreateVoucherAsync(userId, request);

            // Assert
            Assert.Contains("success", result, StringComparison.OrdinalIgnoreCase);
        }

        // ----------------------------
        // DeleteVoucherAsync
        // ----------------------------
        [Fact(DisplayName = "DeleteVoucherAsync - Voucher found - Returns success message")]
        public async Task DeleteVoucherAsync_Success()
        {
            // Arrange
            var voucher = new Voucher { VoucherId = 1 };
            _voucherRepoMock.Setup(r => r.GetVoucherByIdAsync(1)).ReturnsAsync(voucher);
            _voucherRepoMock.Setup(r => r.DeleteVoucherAsync(voucher))
                .ReturnsAsync("Delete voucher successfully!");

            // Act
            var result = await _service.DeleteVoucherAsync(1);

            // Assert
            Assert.Equal("Delete voucher successfully!", result);
        }

        [Fact(DisplayName = "DeleteVoucherAsync - Voucher not found - Returns error")]
        public async Task DeleteVoucherAsync_NotFound()
        {
            _voucherRepoMock.Setup(r => r.GetVoucherByIdAsync(999)).ReturnsAsync((Voucher)null);

            var result = await _service.DeleteVoucherAsync(999);

            Assert.Equal("Voucher not found!", result);
        }

        // ----------------------------
        // GetVoucherByIdAsync
        // ----------------------------
        [Fact(DisplayName = "GetVoucherByIdAsync - Returns mapped voucher correctly")]
        public async Task GetVoucherByIdAsync_ReturnsMappedVoucher()
        {
            // Arrange
            var voucher = new Voucher
            {
                VoucherId = 5,
                Code = "WELCOME10",
                Description = "Welcome discount",
                DiscountValue = 10,
                IsActive = true
            };

            var expectedDto = new ResponseDTOVoucher
            {
                Code = "WELCOME10",
                Description = "Welcome discount",
                DiscountValue = 10,
                IsActive = true
            };

            _voucherRepoMock.Setup(r => r.GetVoucherByIdAsync(5)).ReturnsAsync(voucher);
            _mapperMock.Setup(m => m.Map<ResponseDTOVoucher>(voucher)).Returns(expectedDto);

            // Act
            var result = await _service.GetVoucherByIdAsync(5);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("WELCOME10", result.Code);
            Assert.Equal(expectedDto, result);
        }

        // ----------------------------
        // UpdateVoucherAsync
        // ----------------------------
        [Fact(DisplayName = "UpdateVoucherAsync - Success - Returns success message")]
        public async Task UpdateVoucherAsync_Success()
        {
            // Arrange
            var request = new RequestUpdateVoucher { Description = "Updated desc" };
            var voucher = new Voucher { VoucherId = 1 };

            _voucherRepoMock.Setup(r => r.GetVoucherByIdAsync(1)).ReturnsAsync(voucher);
            _voucherRepoMock.Setup(r => r.UpdateVoucherAsync(voucher, request))
                .ReturnsAsync("Update voucher successfully!");

            // Act
            var result = await _service.UpdateVoucherAsync(1, request);

            // Assert
            Assert.Equal("Update voucher successfully!", result);
        }

        [Fact(DisplayName = "UpdateVoucherAsync - Voucher not found - Returns error")]
        public async Task UpdateVoucherAsync_NotFound()
        {
            _voucherRepoMock.Setup(r => r.GetVoucherByIdAsync(999)).ReturnsAsync((Voucher)null);

            var result = await _service.UpdateVoucherAsync(999, new RequestUpdateVoucher());

            Assert.Equal("Voucher not found!", result);
        }

        [Theory(DisplayName = "UpdateVoucherAsync - Invalid voucherId format still accepted (int overload)")]
        [InlineData(0)]
        [InlineData(-1)]
        public async Task UpdateVoucherAsync_InvalidId_Accepted(int invalidId)
        {
            _voucherRepoMock.Setup(r => r.GetVoucherByIdAsync(invalidId)).ReturnsAsync((Voucher)null);

            var result = await _service.UpdateVoucherAsync(invalidId, new RequestUpdateVoucher());

            Assert.Equal("Voucher not found!", result);
        }
    }
}