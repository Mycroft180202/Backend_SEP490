using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using Microsoft.Extensions.Logging;
using Moq;

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
    }
}
