using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Moq;

namespace Backend_SEP490.UnitTests
{
    public class BlogUnitTests
    {
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IBlogRepositories> _blogRepoMock;
        private readonly Mock<Cloudinary> _cloudinaryMock;
        private readonly BlogPostServiceImpl _service;

        public BlogUnitTests()
        {
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _blogRepoMock = new Mock<IBlogRepositories>();
            _cloudinaryMock = new Mock<Cloudinary>("cloudinary://test");

            _unitOfWorkMock.Setup(u => u.Blog).Returns(_blogRepoMock.Object);

            _service = new BlogPostServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object, _cloudinaryMock.Object);
        }

        // -------------------------------
        // CreateBlogPostAsync Tests
        // -------------------------------
        [Fact(DisplayName = "CreateBlogPostAsync - Normal Case - Creates successfully")]
        public async Task CreateBlogPostAsync_ReturnsStatus_WhenCreated()
        {
            var userId = "U001";

            var fileMock = new Mock<IFormFile>();
            fileMock.Setup(f => f.OpenReadStream()).Returns(new MemoryStream());
            fileMock.Setup(f => f.FileName).Returns("image.png");

            var request = new RequestCreateBlogPost
            {
                Title = "My Blog",
                Content = "Content",
                Image = fileMock.Object
            };

            var uploadResult = new ImageUploadResult { SecureUrl = new Uri("https://cloudinary.com/img.png") };
            _cloudinaryMock.Setup(c => c.UploadAsync(It.IsAny<ImageUploadParams>(), default))
                .ReturnsAsync(uploadResult);

            _blogRepoMock.Setup(r => r.GetAllBlogPostAsync()).ReturnsAsync(new List<BlogPost>());
            _blogRepoMock.Setup(r => r.CreateBlogPostAsync(It.IsAny<BlogPost>()))
                .ReturnsAsync("Create Blog successfully!");

            var result = await _service.CreateBlogPostAsync(userId, request);

            Assert.Equal("Create Blog successfully!", result);
        }

        // Case: Title is null
        [Fact(DisplayName = "CreateBlogPostAsync - Null Title - Throws Exception")]
        public async Task CreateBlogPostAsync_ReturnsError_WhenTitleIsNull()
        {
            var request = new RequestCreateBlogPost
            {
                Title = null!,
                Content = "Valid content",
                Image = null
            };

            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _service.CreateBlogPostAsync("U001", request));
        }

        // Case: Null Request
        [Fact(DisplayName = "CreateBlogPostAsync - Null Request - Throws Exception")]
        public async Task CreateBlogPostAsync_ThrowsException_WhenRequestIsNull()
        {
            RequestCreateBlogPost? request = null;
            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                _service.CreateBlogPostAsync("U001", request!));
        }

        // -------------------------------
        // GetAllBlogPostAsync Tests
        // -------------------------------
        [Fact(DisplayName = "GetAllBlogPostAsync - Normal Case - Returns paged result")]
        public async Task GetAllBlogPostAsync_ReturnsPagedResult()
        {
            var blogEntities = new List<BlogPost>
            {
                new BlogPost { Id = "B1" },
                new BlogPost { Id = "B2" },
                new BlogPost { Id = "B3" }
            };

            var blogDtos = new List<ResponseDTOBlogPost>
            {
                new ResponseDTOBlogPost(), new ResponseDTOBlogPost()
            };

            _blogRepoMock.Setup(r => r.GetAllBlogPostAsync()).ReturnsAsync(blogEntities);
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOBlogPost>>(It.IsAny<IEnumerable<BlogPost>>()))
                .Returns(blogDtos);

            var result = await _service.GetAllBlogPostAsync(1, 2);

            Assert.Equal(3, result.TotalCount);
            Assert.Equal(2, result.Items.Count());
        }

        [Fact(DisplayName = "GetAllBlogPostAsync - Empty list - Returns empty paged result")]
        public async Task GetAllBlogPostAsync_EmptyList_ReturnsEmptyResult()
        {
            _blogRepoMock.Setup(r => r.GetAllBlogPostAsync()).ReturnsAsync(new List<BlogPost>());
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOBlogPost>>(It.IsAny<IEnumerable<BlogPost>>()))
                .Returns(new List<ResponseDTOBlogPost>());

            var result = await _service.GetAllBlogPostAsync(1, 5);

            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalCount);
        }

        // -------------------------------
        // GetBlogByIdAsync Tests
        // -------------------------------
        [Fact(DisplayName = "GetBlogByIdAsync - Normal Case - Returns mapped blog")]
        public async Task GetBlogByIdAsync_ReturnsMappedBlog()
        {
            var blogEntity = new BlogPost { Id = "B001", Title = "Blog1" };
            var blogDto = new ResponseDTOBlogPost { Title = "Blog1" };

            _blogRepoMock.Setup(r => r.GetBlogByIdAsync("B001")).ReturnsAsync(blogEntity);
            _mapperMock.Setup(m => m.Map<ResponseDTOBlogPost>(blogEntity)).Returns(blogDto);

            var result = await _service.GetBlogByIdAsync("B001");

            Assert.NotNull(result);
            Assert.Equal("Blog1", result.Title);
        }

        [Fact(DisplayName = "GetBlogByIdAsync - NotFound - Returns null")]
        public async Task GetBlogByIdAsync_NotFound_ReturnsNull()
        {
            _blogRepoMock.Setup(r => r.GetBlogByIdAsync("X")).ReturnsAsync((BlogPost)null);

            var result = await _service.GetBlogByIdAsync("X");

            Assert.Null(result);
        }

        // -------------------------------
        // UpdateBlogPostAsync Tests
        // -------------------------------
        [Fact(DisplayName = "UpdateBlogPostAsync - Normal Case - Updates successfully")]
        public async Task UpdateBlogPostAsync_ReturnsStatus_WhenUpdated()
        {
            var blogEntity = new BlogPost { Id = "B001", Image = "old.png" };

            var request = new RequestUpdateBlogPost
            {
                Title = "New",
                Content = "New content",
                Image = null
            };

            _blogRepoMock.Setup(r => r.GetBlogByIdAsync("B001")).ReturnsAsync(blogEntity);
            _blogRepoMock.Setup(r => r.UpdateBlogPostAsync(blogEntity, request, "old.png"))
                .ReturnsAsync("Updated");

            var result = await _service.UpdateBlogPostAsync("B001", request);

            Assert.Equal("Updated", result);
        }

        [Fact(DisplayName = "UpdateBlogPostAsync - Blog not found - Returns error")]
        public async Task UpdateBlogPostAsync_ReturnsError_WhenNotFound()
        {
            _blogRepoMock.Setup(r => r.GetBlogByIdAsync("INVALID"))
                .ReturnsAsync((BlogPost)null);

            var result = await _service.UpdateBlogPostAsync("INVALID", new RequestUpdateBlogPost());

            Assert.Equal("Blog not found!", result);
        }

        [Fact(DisplayName = "UpdateBlogPostAsync - Repo returns empty string - Returns empty string")]
        public async Task UpdateBlogPostAsync_RepoReturnsEmptyString_ReturnsEmptyString()
        {
            var blogEntity = new BlogPost { Id = "B001", Image = "old.png" };

            var request = new RequestUpdateBlogPost { Title = "New" };

            _blogRepoMock.Setup(r => r.GetBlogByIdAsync("B001")).ReturnsAsync(blogEntity);
            _blogRepoMock.Setup(r => r.UpdateBlogPostAsync(blogEntity, request, "old.png"))
                .ReturnsAsync("");

            var result = await _service.UpdateBlogPostAsync("B001", request);

            Assert.Equal("", result);
        }

        // -------------------------------
        // DeleteBlogPostAsync
        // -------------------------------
        [Fact(DisplayName = "DeleteBlogPostAsync - Normal Case - Deletes successfully")]
        public async Task DeleteBlogPostAsync_Normal_ReturnsStatus()
        {
            var blogEntity = new BlogPost { Id = "B001" };

            _blogRepoMock.Setup(r => r.GetBlogByIdAsync("B001")).ReturnsAsync(blogEntity);
            _blogRepoMock.Setup(r => r.DeleteBlogPostAsync(blogEntity)).ReturnsAsync("Deleted");

            var result = await _service.DeleteBlogPostAsync("B001");

            Assert.Equal("Deleted", result);
        }

        [Fact(DisplayName = "DeleteBlogPostAsync - NotFound - Returns error")]
        public async Task DeleteBlogPostAsync_NotFound_ReturnsError()
        {
            _blogRepoMock.Setup(r => r.GetBlogByIdAsync("X")).ReturnsAsync((BlogPost)null);

            var result = await _service.DeleteBlogPostAsync("X");

            Assert.Equal("Blog not found!", result);
        }
    }
}
