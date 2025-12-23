using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Http;
using Moq;

namespace Backend_SEP490.UnitTests
{
    public class StoryTellingUnitTests
    {
        private readonly Mock<IUnitOfWork> _uowMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Cloudinary _cloudinary;
        private readonly StoryTellingServiceImpl _service;

        public StoryTellingUnitTests()
        {
            _uowMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();

            // === Sử dụng Cloudinary thật ===
            var account = new Account(
                "diyhln2nu",
                "969151893336946",
                "1Q5Qn2U1_ErgzkCOo_365GKBawo"
            );
            _cloudinary = new Cloudinary(account);

            _service = new StoryTellingServiceImpl(
                _mapperMock.Object,
                _uowMock.Object,
                _cloudinary
            );
        }

        // -------------------------------
        // CreateStoryTellingAsync
        // -------------------------------
        [Fact]
        public async Task CreateStoryTellingAsync_ReturnsSuccess_WhenUserExists_NoImage()
        {
            var userId = "U1";
            var request = new RequestCreateStoryTelling
            {
                ProductId = "P1",
                StoryType = "ProductStory", 
                Title = "Title",
                Content = "Content",
                Image = null
            };

            var user = new User { UserID = userId };
            _uowMock.Setup(u => u.Users.GetUserByIDWithDetailAsync(userId)).ReturnsAsync(user);
            _uowMock.Setup(u => u.StoryTelling.CreateStoryTellingAsync(It.IsAny<StoryTelling>()))
                    .ReturnsAsync("Created");

            var result = await _service.CreateStoryTellingAsync(userId, request);

            Assert.Equal("Created", result);
        }


        [Fact]
        public async Task CreateStoryTellingAsync_ReturnsUserNotFound_WhenUserDoesNotExist()
        {
            var request = new RequestCreateStoryTelling
            {
                ProductId = "P1",
                StoryType = "Story",
                Title = "Title",
                Content = "Content",
                Image = null
            };

            _uowMock.Setup(u => u.Users.GetUserByIDWithDetailAsync("U1")).ReturnsAsync((User?)null);

            var result = await _service.CreateStoryTellingAsync("U1", request);

            Assert.Equal("User not found!", result);
        }

        // -------------------------------
        // DeleteStoryTellingAsync
        // -------------------------------
        [Fact]
        public async Task DeleteStoryTellingAsync_ReturnsSuccess_WhenStoryExists()
        {
            var storyId = 1;
            var story = new StoryTelling { Id = storyId };

            _uowMock.Setup(u => u.StoryTelling.GetStoryTellingByIdAsync(storyId)).ReturnsAsync(story);
            _uowMock.Setup(u => u.StoryTelling.DeleteStoryTellingAsync(story)).ReturnsAsync("Deleted");

            var result = await _service.DeleteStoryTellingAsync(storyId);

            Assert.Equal("Deleted", result);
        }

        [Fact]
        public async Task DeleteStoryTellingAsync_ReturnsNotFound_WhenStoryDoesNotExist()
        {
            _uowMock.Setup(u => u.StoryTelling.GetStoryTellingByIdAsync(1)).ReturnsAsync((StoryTelling?)null);

            var result = await _service.DeleteStoryTellingAsync(1);

            Assert.Equal("Not Found!", result);
        }

        // -------------------------------
        // GetAllStoryTellingByProductIdAsync
        // -------------------------------
        [Fact]
        public async Task GetAllStoryTellingByProductIdAsync_ReturnsMappedList()
        {
            var productId = "P1";
            var stories = new List<StoryTelling> { new(), new() };
            var dtos = new List<ResponseDTOStoryTelling> { new(), new() };

            _uowMock.Setup(u => u.StoryTelling.GetAllStoryTellingByProductIdAsync(productId))
                    .ReturnsAsync(stories);
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOStoryTelling>>(stories)).Returns(dtos);

            var result = await _service.GetAllStoryTellingByProductIdAsync(productId);

            Assert.Equal(2, result.Count);
        }

        [Fact]
        public async Task GetAllStoryTellingByProductIdAsync_ReturnsEmptyList_WhenNoStories()
        {
            _uowMock.Setup(u => u.StoryTelling.GetAllStoryTellingByProductIdAsync("P1"))
                    .ReturnsAsync(new List<StoryTelling>());
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOStoryTelling>>(It.IsAny<IEnumerable<StoryTelling>>()))
                       .Returns(new List<ResponseDTOStoryTelling>());

            var result = await _service.GetAllStoryTellingByProductIdAsync("P1");

            Assert.Empty(result);
        }

        // -------------------------------
        // GetStoryTellingByIdAsync
        // -------------------------------
        [Fact]
        public async Task GetStoryTellingByIdAsync_ReturnsMappedDto()
        {
            var story = new StoryTelling { Id = 1 };
            var dto = new ResponseDTOStoryTelling { Id = 1 };

            _uowMock.Setup(u => u.StoryTelling.GetStoryTellingByIdAsync(1)).ReturnsAsync(story);
            _mapperMock.Setup(m => m.Map<ResponseDTOStoryTelling>(story)).Returns(dto);

            var result = await _service.GetStoryTellingByIdAsync(1);

            Assert.Equal(1, result.Id);
        }

        [Fact]
        public async Task GetStoryTellingByIdAsync_ReturnsNull_WhenStoryDoesNotExist()
        {
            _uowMock.Setup(u => u.StoryTelling.GetStoryTellingByIdAsync(1)).ReturnsAsync((StoryTelling?)null);
            _mapperMock.Setup(m => m.Map<ResponseDTOStoryTelling>((StoryTelling?)null)).Returns((ResponseDTOStoryTelling?)null);

            var result = await _service.GetStoryTellingByIdAsync(1);

            Assert.Null(result);
        }

        // -------------------------------
        // UpdateStoryTellingAsync
        // -------------------------------
        [Fact]
        public async Task UpdateStoryTellingAsync_ReturnsSuccess_WhenStoryExists_NoImage()
        {
            var storyId = 1;
            var request = new RequestUpdateStoryTelling
            {
                Title = "New Title",
                Content = "New Content",
                Image = null
            };
            var story = new StoryTelling { Id = storyId, Image = "old.png" };

            _uowMock.Setup(u => u.StoryTelling.GetStoryTellingByIdAsync(storyId)).ReturnsAsync(story);
            _uowMock.Setup(u => u.StoryTelling.UpdateStoryTellingAsync(story, request, story.Image))
                    .ReturnsAsync("Updated");

            var result = await _service.UpdateStoryTellingAsync(storyId, request);

            Assert.Equal("Updated", result);
        }

        [Fact]
        public async Task UpdateStoryTellingAsync_ReturnsNotFound_WhenStoryDoesNotExist()
        {
            var request = new RequestUpdateStoryTelling();
            _uowMock.Setup(u => u.StoryTelling.GetStoryTellingByIdAsync(1)).ReturnsAsync((StoryTelling?)null);

            var result = await _service.UpdateStoryTellingAsync(1, request);

            Assert.Equal("Not Found!", result);
        }
    }
}
