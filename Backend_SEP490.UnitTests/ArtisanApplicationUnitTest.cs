using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using CloudinaryDotNet;
using Microsoft.Extensions.Logging;
using Moq;

namespace Backend_SEP490.UnitTests
{
    public class ArtisanApplicationUnitTests
    {
        private readonly Mock<IUnitOfWork> _uow;
        private readonly Mock<IMapper> _mapper;
        private readonly Mock<INotificationService> _noti;
        private readonly Mock<ILogger<ArtisanApplicationService>> _logger;
        private readonly Cloudinary _cloudinary;
        private readonly ArtisanApplicationService _service;

        public ArtisanApplicationUnitTests()
        {
            _uow = new Mock<IUnitOfWork>();
            _mapper = new Mock<IMapper>();
            _noti = new Mock<INotificationService>();
            _logger = new Mock<ILogger<ArtisanApplicationService>>();

            // === Sử dụng Cloudinary thật ===
            var account = new Account(
                "diyhln2nu",
                "969151893336946",
                "1Q5Qn2U1_ErgzkCOo_365GKBawo"
            );
            _cloudinary = new Cloudinary(account);

            _service = new ArtisanApplicationService(
                _mapper.Object,
                _uow.Object,
                _noti.Object,
                _logger.Object,
                _cloudinary
            );
        }

        [Fact]
        public async Task CreateAsync_ReturnsSuccess()
        {
            var req = new RequestCreateArtisanApplication
            {
                FullName = "A",
                Email = "a@gmail.com"
            };

            var user = new User { UserID = "U1" };

            _uow.Setup(x => x.Users.GetByIdAsync("U1")).ReturnsAsync(user);
            _uow.Setup(x => x.ArtisanApplications.HasActiveApplicationAsync("U1")).ReturnsAsync(false);
            _uow.Setup(x => x.ArtisanApplications.AddAsync(It.IsAny<ArtisanApplication>())).Returns(Task.CompletedTask);

            var result = await _service.CreateAsync("U1", req);

            Assert.True(result.Success);
            _uow.Verify(x => x.SaveChangesAsync());
        }

        [Fact]
        public async Task GetMyApplicationAsync_ReturnsDto()
        {
            var entity = new ArtisanApplication { Id = "AA1" };
            var dto = new ResponseArtisanApplicationDto { Id = "AA1" };

            _uow.Setup(x => x.ArtisanApplications.GetLatestByUserAsync("U1")).ReturnsAsync(entity);
            _mapper.Setup(x => x.Map<ResponseArtisanApplicationDto?>(entity)).Returns(dto);

            var result = await _service.GetMyApplicationAsync("U1");

            Assert.Equal("AA1", result!.Id);
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
        {
            _uow.Setup(x => x.ArtisanApplications.GetByIdWithUserAsync("X"))
                .ReturnsAsync((ArtisanApplication?)null);

            var result = await _service.GetByIdAsync("X");

            Assert.Null(result);
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsDto()
        {
            var entity = new ArtisanApplication { Id = "AA1" };
            var dto = new ResponseArtisanApplicationDto { Id = "AA1" };

            _uow.Setup(x => x.ArtisanApplications.GetByIdWithUserAsync("AA1")).ReturnsAsync(entity);
            _mapper.Setup(x => x.Map<ResponseArtisanApplicationDto?>(entity)).Returns(dto);

            var result = await _service.GetByIdAsync("AA1");

            Assert.Equal("AA1", result!.Id);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsPagedResult()
        {
            var list = new List<ArtisanApplication> { new(), new() };

            _uow.Setup(x => x.ArtisanApplications.GetAsync(null, null, 1, 20)).ReturnsAsync(list);
            _uow.Setup(x => x.ArtisanApplications.CountAsync(null, null)).ReturnsAsync(2);

            _mapper.Setup(x => x.Map<IEnumerable<ResponseArtisanApplicationDto>>(list))
                  .Returns(new List<ResponseArtisanApplicationDto>
                  {
                      new(), new()
                  });

            var result = await _service.GetAllAsync(new());

            Assert.Equal(2, result.TotalCount);
        }

        [Fact]
        public async Task ReviewAsync_ReturnsFalse_WhenNotFound()
        {
            var request = new ReviewArtisanApplicationRequest { Approve = true };

            _uow.Setup(x => x.ArtisanApplications.GetByIdWithUserAsync("AA1"))
                .ReturnsAsync((ArtisanApplication?)null);

            var result = await _service.ReviewAsync("Admin", "AA1", request);

            Assert.False(result.Success);
        }

        [Fact]
        public async Task CreateAsync_ReturnsFalse_WhenUserNotFound()
        {
            var req = new RequestCreateArtisanApplication { FullName = "A", Email = "a@gmail.com" };

            _uow.Setup(x => x.Users.GetByIdAsync("U1")).ReturnsAsync((User?)null);

            var result = await _service.CreateAsync("U1", req);

            Assert.False(result.Success);
        }

        [Fact]
        public async Task CreateAsync_ReturnsFalse_WhenActiveApplicationExists()
        {
            var req = new RequestCreateArtisanApplication { FullName = "A", Email = "a@gmail.com" };
            var user = new User { UserID = "U1" };

            _uow.Setup(x => x.Users.GetByIdAsync("U1")).ReturnsAsync(user);
            _uow.Setup(x => x.ArtisanApplications.HasActiveApplicationAsync("U1")).ReturnsAsync(true);

            var result = await _service.CreateAsync("U1", req);

            Assert.False(result.Success);
        }
    }
}
