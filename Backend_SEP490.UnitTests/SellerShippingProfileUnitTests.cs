using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using Microsoft.Extensions.Logging;
using Moq;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.UnitTests
{
    public class SellerShippingProfileUnitTests
    {
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<ISellerShippingProfileRepository> _repoMock;
        private readonly Mock<ILogger<SellerShippingProfileService>> _loggerMock;
        private readonly SellerShippingProfileService _service;

        public SellerShippingProfileUnitTests()
        {
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _repoMock = new Mock<ISellerShippingProfileRepository>();
            _loggerMock = new Mock<ILogger<SellerShippingProfileService>>();

            _unitOfWorkMock.Setup(u => u.SellerShippingProfiles)
                .Returns(_repoMock.Object);

            _service = new SellerShippingProfileService(
                _mapperMock.Object,
                _unitOfWorkMock.Object,
                _loggerMock.Object);
        }

        // ---------------------------------------------------
        // GET MY PROFILE TESTS
        // ---------------------------------------------------

        [Fact(DisplayName = "GetMyProfileAsync - Empty sellerId returns null")]
        public async Task GetMyProfileAsync_EmptySellerId_ReturnsNull()
        {
            var result = await _service.GetMyProfileAsync("");

            Assert.Null(result);
        }

        [Fact(DisplayName = "GetMyProfileAsync - Profile not found returns null")]
        public async Task GetMyProfileAsync_ProfileNotFound_ReturnsNull()
        {
            _repoMock.Setup(r => r.GetBySellerIdAsync("S001"))
                .ReturnsAsync((SellerShippingProfile)null);

            var result = await _service.GetMyProfileAsync("S001");

            Assert.Null(result);
        }

        [Fact(DisplayName = "GetMyProfileAsync - Profile found returns mapped DTO")]
        public async Task GetMyProfileAsync_ProfileFound_ReturnsDto()
        {
            var profile = new SellerShippingProfile { SellerId = "S001" };
            var dto = new SellerShippingProfileDto { SellerId = "S001" };

            _repoMock.Setup(r => r.GetBySellerIdAsync("S001"))
                .ReturnsAsync(profile);

            _mapperMock.Setup(m => m.Map<SellerShippingProfileDto>(profile))
                .Returns(dto);

            var result = await _service.GetMyProfileAsync("S001");

            Assert.NotNull(result);
            Assert.Equal("S001", result.SellerId);
        }

        // ---------------------------------------------------
        // UPSERT MY PROFILE TESTS
        // ---------------------------------------------------

        [Fact(DisplayName = "UpsertMyProfileAsync - Empty sellerId throws exception")]
        public async Task UpsertMyProfileAsync_EmptySellerId_Throws()
        {
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.UpsertMyProfileAsync("", new UpsertSellerShippingProfileRequest()));
        }

        [Fact(DisplayName = "UpsertMyProfileAsync - Creates new profile when not exists")]
        public async Task UpsertMyProfileAsync_CreatesNewProfile()
        {
            var req = new UpsertSellerShippingProfileRequest
            {
                PickupContactName = "A",
                PickupContactPhone = "0901234567",
                PickupDistrictId = 1
            };

            _repoMock.Setup(r => r.GetBySellerIdAsync("S001"))
                .ReturnsAsync((SellerShippingProfile)null);

            SellerShippingProfile savedProfile = null!;

            _repoMock.Setup(r => r.AddAsync(It.IsAny<SellerShippingProfile>()))
                .Callback<SellerShippingProfile>(p => savedProfile = p)
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync())
                    .ReturnsAsync(1);

            _mapperMock.Setup(m => m.Map<SellerShippingProfileDto>(It.IsAny<SellerShippingProfile>()))
                .Returns(new SellerShippingProfileDto());

            var result = await _service.UpsertMyProfileAsync("S001", req);

            Assert.NotNull(result);
            Assert.NotNull(savedProfile);
            Assert.Equal("S001", savedProfile.SellerId);
            Assert.NotNull(savedProfile.Id);
        }

        [Fact(DisplayName = "UpsertMyProfileAsync - Updates existing profile")]
        public async Task UpsertMyProfileAsync_UpdatesExistingProfile()
        {
            var existing = new SellerShippingProfile
            {
                SellerId = "S001",
                PickupContactName = "Old"
            };

            var req = new UpsertSellerShippingProfileRequest
            {
                PickupContactName = "New",
                PickupDistrictId = 1
            };

            _repoMock.Setup(r => r.GetBySellerIdAsync("S001"))
                .ReturnsAsync(existing);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync())
                    .ReturnsAsync(1);

            var dto = new SellerShippingProfileDto { SellerId = "S001" };
            _mapperMock.Setup(m => m.Map<SellerShippingProfileDto>(existing))
                .Returns(dto);

            var result = await _service.UpsertMyProfileAsync("S001", req);

            Assert.Equal("New", existing.PickupContactName);
            Assert.Equal("S001", result.SellerId);

            _loggerMock.Verify(
                log => log.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    null,
                    (Func<It.IsAnyType, Exception?, string>)It.IsAny<object>()),
                Times.Once);
        }

        // ---------------------------------------------------
        // VALIDATION TESTS FOR DATA ANNOTATIONS
        // ---------------------------------------------------

        [Theory]
        [InlineData(null, true)]           // cho phép null
        [InlineData("0901234567", true)]   // hợp lệ chuẩn 09
        [InlineData("+84901234567", true)] // hợp lệ có +84
        [InlineData("12345", false)]       // quá ngắn, không phải số điện thoại
        [InlineData("090123456abc", false)] // có chữ
        [InlineData("09012345678", false)]  // 11 số → không hợp lệ ở VN
        [InlineData("090 123 4567", false)] // có dấu cách
        public void Validation_PickupContactPhone(string? phone, bool expectedValid)
        {
            // Fail these case above
            //"12345" → Expected false, Actual true
            //"090123456abc" → Expected false, Actual true
            //"09012345678" → Expected false, Actual true
            var request = new UpsertSellerShippingProfileRequest
            {
                PickupContactPhone = phone,
                PickupDistrictId = 1
            };

            var isValid = Validator.TryValidateObject(request, new ValidationContext(request), null, true);
            Assert.Equal(expectedValid, isValid);
        }

        [Theory]
        [InlineData(null, true)]
        [InlineData(100, true)]
        [InlineData(1, true)]
        [InlineData(0, true)]
        [InlineData(101, false)]
        public void Validation_PickupContactName_StringLength(int? length, bool expectedValid)
        {
            var value = length.HasValue ? new string('A', length.Value) : null;
            var request = new UpsertSellerShippingProfileRequest
            {
                PickupContactName = value,
                PickupContactPhone = "0901234567",
                PickupDistrictId = 1
            };

            var isValid = Validator.TryValidateObject(request, new ValidationContext(request), null, true);
            Assert.Equal(expectedValid, isValid);
        }

        [Theory]
        [InlineData(null, true)]
        [InlineData(200, true)]
        [InlineData(1, true)]
        [InlineData(0, true)]
        [InlineData(201, false)]
        public void Validation_PickupAddressLine_StringLength(int? length, bool expectedValid)
        {
            var value = length.HasValue ? new string('A', length.Value) : null;
            var request = new UpsertSellerShippingProfileRequest
            {
                PickupAddressLine = value,
                PickupContactPhone = "0901234567",
                PickupDistrictId = 1
            };

            var isValid = Validator.TryValidateObject(request, new ValidationContext(request), null, true);
            Assert.Equal(expectedValid, isValid);
        }

        [Theory]
        [InlineData(null, true)]
        [InlineData(100, true)]
        [InlineData(1, true)]
        [InlineData(0, true)]
        [InlineData(101, false)]
        public void Validation_PickupProvinceName_StringLength(int? length, bool expectedValid)
        {
            var value = length.HasValue ? new string('A', length.Value) : null;
            var request = new UpsertSellerShippingProfileRequest
            {
                PickupProvinceName = value,
                PickupContactPhone = "0901234567",
                PickupDistrictId = 1
            };

            var isValid = Validator.TryValidateObject(request, new ValidationContext(request), null, true);
            Assert.Equal(expectedValid, isValid);
        }

        [Theory]
        [InlineData(null, false)]
        [InlineData(0, false)]
        [InlineData(-5, false)]
        [InlineData(1, true)]
        [InlineData(100, true)]
        public void Validation_PickupDistrictId_Range(int? districtId, bool expectedValid)
        {
            // fail case null
            var request = new UpsertSellerShippingProfileRequest
            {
                PickupDistrictId = districtId,
                PickupContactPhone = "0901234567"
            };

            var isValid = Validator.TryValidateObject(request, new ValidationContext(request), null, true);
            Assert.Equal(expectedValid, isValid);
        }

        [Fact]
        public void Validation_ValidModel_Passes()
        {
            var request = new UpsertSellerShippingProfileRequest
            {
                PickupContactName = "Nguyễn Văn A",
                PickupContactPhone = "0901234567",
                PickupAddressLine = "123 Đường Láng",
                PickupProvinceName = "Hà Nội",
                PickupDistrictId = 1,
                PickupWardCode = "00123",
                GhnToken = "token123",
                GhnShopId = 12345,
                IsActive = true
            };

            var isValid = Validator.TryValidateObject(request, new ValidationContext(request), null, true);
            Assert.True(isValid);
        }

        [Fact]
        public void Validation_MultipleErrors_Collected()
        {
            var request = new UpsertSellerShippingProfileRequest
            {
                PickupContactName = new string('A', 150),
                PickupContactPhone = "123abc",
                PickupAddressLine = new string('B', 250),
                PickupProvinceName = new string('C', 150),
                PickupDistrictId = 0
            };

            var results = new List<ValidationResult>();
            var isValid = Validator.TryValidateObject(request, new ValidationContext(request), results, true);

            Assert.False(isValid);
            Assert.Equal(5, results.Count);
        }
    }
}
