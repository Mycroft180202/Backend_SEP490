using Xunit;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
namespace Backend_SEP490.UnitTests
{
    public class VoucherUnitTests
    {
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _uowMock;
        private readonly Mock<IVoucherRepositories> _voucherRepoMock;
        private readonly VoucherServiceImpl _service;

        public VoucherUnitTests()
        {
            _mapperMock = new Mock<IMapper>();
            _uowMock = new Mock<IUnitOfWork>();
            _voucherRepoMock = new Mock<IVoucherRepositories>();
            _uowMock.Setup(u => u.Voucher).Returns(_voucherRepoMock.Object);
            _service = new VoucherServiceImpl(_mapperMock.Object, _uowMock.Object);
        }

        // ----------------------------
        // CreateVoucherAsync
        // ----------------------------
        [Fact(DisplayName = "CreateVoucherAsync - Normal case - Returns success")]
        public async Task CreateVoucherAsync_Success()
        {
            var request = new RequestCreateVoucher { Code = "ABC123" };
            _voucherRepoMock.Setup(r => r.GetVoucherByCodeAsync(request.Code)).ReturnsAsync((Voucher?)null);
            _voucherRepoMock.Setup(r => r.CreateVoucherAsync(It.IsAny<Voucher>())).ReturnsAsync("Create voucher successfully!");

            var result = await _service.CreateVoucherAsync("U001", request);

            Assert.Equal("Create voucher successfully!", result);
            _voucherRepoMock.Verify(r => r.CreateVoucherAsync(It.IsAny<Voucher>()), Times.Once);
        }

        [Fact(DisplayName = "CreateVoucherAsync - Code already exists - Returns error")]
        public async Task CreateVoucherAsync_CodeExists()
        {
            var request = new RequestCreateVoucher { Code = "EXIST" };
            _voucherRepoMock.Setup(r => r.GetVoucherByCodeAsync(request.Code)).ReturnsAsync(new Voucher());

            var result = await _service.CreateVoucherAsync("U001", request);

            Assert.Equal("Voucher Code is already exist!", result);
        }

        [Theory(DisplayName = "CreateVoucherAsync - Invalid input throws exception")]
        [InlineData(null)]
        [InlineData("")]
        public async Task CreateVoucherAsync_InvalidUserId_ThrowsException(string invalidUserId)
        {
            var request = new RequestCreateVoucher { Code = "ABC123" };
            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateVoucherAsync(invalidUserId!, request));
        }

        [Fact(DisplayName = "CreateVoucherAsync - Null request throws exception")]
        public async Task CreateVoucherAsync_NullRequest_ThrowsException()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateVoucherAsync("U001", null!));
        }

        // ----------------------------
        // DeleteVoucherAsync
        // ----------------------------
        [Fact(DisplayName = "DeleteVoucherAsync - Voucher found - Success")]
        public async Task DeleteVoucherAsync_Success()
        {
            var voucher = new Voucher { VoucherId = 1 };
            _voucherRepoMock.Setup(r => r.GetVoucherByIdAsync("1")).ReturnsAsync(voucher);
            _voucherRepoMock.Setup(r => r.DeleteVoucherAsync(voucher)).ReturnsAsync("Delete voucher successfully!");

            var result = await _service.DeleteVoucherAsync("1");

            Assert.Equal("Delete voucher successfully!", result);
        }

        [Fact(DisplayName = "DeleteVoucherAsync - Voucher not found")]
        public async Task DeleteVoucherAsync_NotFound()
        {
            _voucherRepoMock.Setup(r => r.GetVoucherByIdAsync("999")).ReturnsAsync((Voucher?)null);

            var result = await _service.DeleteVoucherAsync("999");

            Assert.Equal("Voucher not found!", result);
        }


        // ----------------------------
        // GetVoucherByIdAsync
        // ----------------------------
        [Fact(DisplayName = "GetVoucherByIdAsync - Returns mapped voucher with all fields")]
        public async Task GetVoucherByIdAsync_ReturnsVoucher()
        {
            var voucher = new Voucher
            {
                VoucherId = 1,
                Code = "A",
                Description = "Desc A",
                DiscountType = "Percent",
                DiscountValue = 10,
                MinOrderAmount = 100,
                MaxDiscountAmount = 50,
                StartDate = DateTime.UtcNow.AddDays(-1),
                EndDate = DateTime.UtcNow.AddDays(10),
                UsageLimit = 5,
                UsedCount = 1,
                IsActive = true,
                CreatedDate = DateTime.UtcNow.AddDays(-2),
                CreatedById = "U001",
                UpdatedDate = DateTime.UtcNow
            };

            _voucherRepoMock.Setup(r => r.GetVoucherByIdAsync("1")).ReturnsAsync(voucher);
            _mapperMock.Setup(m => m.Map<ResponseDTOVoucher>(voucher)).Returns(new ResponseDTOVoucher
            {
                Code = voucher.Code,
                Description = voucher.Description,
                DiscountType = voucher.DiscountType,
                DiscountValue = voucher.DiscountValue,
                MinOrderAmount = voucher.MinOrderAmount,
                MaxDiscountAmount = voucher.MaxDiscountAmount,
                StartDate = voucher.StartDate,
                EndDate = voucher.EndDate,
                UsageLimit = voucher.UsageLimit,
                UsedCount = voucher.UsedCount,
                IsActive = voucher.IsActive,
                CreatedDate = voucher.CreatedDate,
                CreatedById = voucher.CreatedById,
                UpdatedDate = voucher.UpdatedDate
            });

            var result = await _service.GetVoucherByIdAsync("1");

            Assert.Equal("A", result.Code);
            Assert.Equal("Desc A", result.Description);
            Assert.Equal("Percent", result.DiscountType);
            Assert.Equal(10, result.DiscountValue);
            Assert.Equal(100, result.MinOrderAmount);
            Assert.Equal(50, result.MaxDiscountAmount);
            Assert.True(result.IsActive);
            Assert.Equal("U001", result.CreatedById);
        }


        // ----------------------------
        // UpdateVoucherAsync
        // ----------------------------
        [Fact(DisplayName = "UpdateVoucherAsync - Success")]
        public async Task UpdateVoucherAsync_Success()
        {
            var request = new RequestUpdateVoucher();
            var voucher = new Voucher { VoucherId = 1 };

            _voucherRepoMock.Setup(r => r.GetVoucherByIdAsync("1")).ReturnsAsync(voucher);
            _voucherRepoMock.Setup(r => r.UpdateVoucherAsync(voucher, request)).ReturnsAsync("Update voucher successfully!");

            var result = await _service.UpdateVoucherAsync("1", request);

            Assert.Equal("Update voucher successfully!", result);
        }

        [Fact(DisplayName = "UpdateVoucherAsync - Not found")]
        public async Task UpdateVoucherAsync_NotFound()
        {
            _voucherRepoMock.Setup(r => r.GetVoucherByIdAsync("999")).ReturnsAsync((Voucher?)null);

            var result = await _service.UpdateVoucherAsync("999", new RequestUpdateVoucher());

            Assert.Equal("Voucher not found!", result);
        }

        [Theory(DisplayName = "UpdateVoucherAsync - Invalid voucherId throws exception")]
        [InlineData(null)]
        [InlineData("")]
        public async Task UpdateVoucherAsync_InvalidId_ThrowsException(string invalidId)
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.UpdateVoucherAsync(invalidId!, new RequestUpdateVoucher()));
        }

        [Fact(DisplayName = "UpdateVoucherAsync - Null request throws exception")]
        public async Task UpdateVoucherAsync_NullRequest_ThrowsException()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.UpdateVoucherAsync("1", null!));
        }
    }
}