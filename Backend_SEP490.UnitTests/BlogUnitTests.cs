using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services.impl;
using Moq;

namespace Backend_SEP490.UnitTests
{
    public class BlogUnitTests
    {
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IBlogRepositories> _blogRepoMock;
        private readonly BlogPostServiceImpl _service;

        public BlogUnitTests()
        {
            _mapperMock = new Mock<IMapper>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _blogRepoMock = new Mock<IBlogRepositories>();

            _unitOfWorkMock.Setup(u => u.Blog).Returns(_blogRepoMock.Object);

            _service = new BlogPostServiceImpl(_mapperMock.Object, _unitOfWorkMock.Object);
        }

        // -------------------------------
        // CreateBlogPostAsync Tests
        // -------------------------------
        [Fact(DisplayName = "CreateBlogPostAsync - Normal Case - Creates successfully")]
        public async Task CreateBlogPostAsync_ReturnsStatus_WhenCreated()
        {
            var userId = "U001";
            var request = new RequestCreateBlogPost
            {
                Title = "My Blog",
                Content = "Content",
                Image = "image.png"
            };

            var existingBlogs = new List<BlogPost>
            {
                new BlogPost { Id = "B001" }
            };

            _blogRepoMock.Setup(r => r.GetAllBlogPostAsync())
                .ReturnsAsync(existingBlogs);

            _blogRepoMock.Setup(r => r.CreateBlogPostAsync(It.IsAny<BlogPost>()))
                .ReturnsAsync("Create Blog successfully!");

            var result = await _service.CreateBlogPostAsync(userId, request);

            Assert.Equal("Create Blog successfully!", result);
            _blogRepoMock.Verify(r => r.CreateBlogPostAsync(It.Is<BlogPost>(
                b => b.Title == "My Blog" &&
                     b.Content == "Content" &&
                     b.Image == "image.png" &&
                     b.AuthorId == userId &&
                     b.PostStatus == "Active"
            )), Times.Once);
        }
        // -------------------------------
        // CreateBlogPostAsync - Boundary / Invalid Tests
        // -------------------------------

        // Case: Title is null
        [Fact(DisplayName = "CreateBlogPostAsync - Null Title - Throws Exception or Returns Error")]
        public async Task CreateBlogPostAsync_ReturnsError_WhenTitleIsNull()
        {
            var userId = "U001";
            var request = new RequestCreateBlogPost
            {
                Title = null!,
                Content = "This is a valid content with more than 20 characters",
                Image = "https://example.com/image.png"
            };

            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateBlogPostAsync(userId, request));
        }

        // Case: Image is not a valid URL
        [Fact(DisplayName = "CreateBlogPostAsync - Invalid Image URL - Returns False")]
        public async Task CreateBlogPostAsync_ReturnsError_WhenImageInvalid()
        {
            var userId = "U001";
            var request = new RequestCreateBlogPost
            {
                Title = "Valid Title",
                Content = "This content has more than 20 characters",
                Image = "invalid-url"
            };

            var result = await _service.CreateBlogPostAsync(userId, request);

            Assert.Equal("Create Blog successfully!", result);
        }

        // Case: Null Request
        [Fact(DisplayName = "CreateBlogPostAsync - Null Request - Throws Exception")]
        public async Task CreateBlogPostAsync_ThrowsException_WhenRequestIsNull()
        {
            string userId = "U001";
            RequestCreateBlogPost? request = null;

            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateBlogPostAsync(userId, request!));
        }

        // -------------------------------
        // GetAllBlogPostAsync Tests
        // -------------------------------
        [Fact(DisplayName = "GetAllBlogPostAsync - Normal Case - Returns paged result")]
        public async Task GetAllBlogPostAsync_ReturnsPagedResult()
        {
            var blogEntities = new List<BlogPost>
            {
                new BlogPost { Id = "B001", Title = "Blog1", Content="C1", Image="I1", AuthorId="U1", PostStatus="Active", PublishedAt=DateTime.UtcNow },
                new BlogPost { Id = "B002", Title = "Blog2", Content="C2", Image="I2", AuthorId="U2", PostStatus="Active", PublishedAt=DateTime.UtcNow },
                new BlogPost { Id = "B003", Title = "Blog3", Content="C3", Image="I3", AuthorId="U3", PostStatus="Active", PublishedAt=DateTime.UtcNow }
            };

            var blogDtos = new List<ResponseDTOBlogPost>
            {
                new ResponseDTOBlogPost { Title = "Blog1", Content="C1", Image="I1", AuthorId="U1", PostStatus="Active", PublishedAt=DateTime.UtcNow },
                new ResponseDTOBlogPost { Title = "Blog2", Content="C2", Image="I2", AuthorId="U2", PostStatus="Active", PublishedAt=DateTime.UtcNow }
            };

            _blogRepoMock.Setup(r => r.GetAllBlogPostAsync()).ReturnsAsync(blogEntities);
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOBlogPost>>(It.IsAny<IEnumerable<BlogPost>>()))
                .Returns(blogDtos);

            var result = await _service.GetAllBlogPostAsync(1, 2);

            Assert.Equal(2, result.Items.Count());
            Assert.Equal(3, result.TotalCount);
            Assert.Equal(1, result.PageIndex);
            Assert.Equal(2, result.PageSize);
            _blogRepoMock.Verify(r => r.GetAllBlogPostAsync(), Times.Once);
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
            Assert.Equal(1, result.PageIndex);
            Assert.Equal(5, result.PageSize);
        }
        [Fact(DisplayName = "GetAllBlogPostAsync - Page beyond range - Returns empty items")]
        public async Task GetAllBlogPostAsync_PageBeyondRange_ReturnsEmptyItems()
        {
            var blogEntities = new List<BlogPost>
            {
                new BlogPost { Id = "B1" }, new BlogPost { Id = "B2" }, new BlogPost { Id = "B3" }
            };
                    _blogRepoMock.Setup(r => r.GetAllBlogPostAsync()).ReturnsAsync(blogEntities);
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOBlogPost>>(It.IsAny<IEnumerable<BlogPost>>()))
                .Returns(new List<ResponseDTOBlogPost>());

            var result = await _service.GetAllBlogPostAsync(3, 2);

            Assert.Empty(result.Items);
            Assert.Equal(3, result.TotalCount);
        }
        [Fact(DisplayName = "GetAllBlogPostAsync - Page size larger than total - Returns all items")]
        public async Task GetAllBlogPostAsync_PageSizeLargerThanTotal_ReturnsAllItems()
        {
            var blogEntities = new List<BlogPost>
                {
                    new BlogPost { Id = "B1" }, new BlogPost { Id = "B2" }
                };
                        var blogDtos = new List<ResponseDTOBlogPost>
                {
                    new ResponseDTOBlogPost(), new ResponseDTOBlogPost()
                };

            _blogRepoMock.Setup(r => r.GetAllBlogPostAsync()).ReturnsAsync(blogEntities);
            _mapperMock.Setup(m => m.Map<IEnumerable<ResponseDTOBlogPost>>(It.IsAny<IEnumerable<BlogPost>>()))
                .Returns(blogDtos);

            var result = await _service.GetAllBlogPostAsync(1, 10);

            Assert.Equal(2, result.Items.Count());
            Assert.Equal(2, result.TotalCount);
        }
  
        // -------------------------------
        // GetAllOrderByIdAsync Tests
        // -------------------------------
        [Fact(DisplayName = "GetAllOrderByIdAsync - Normal Case - Returns mapped blog")]
        public async Task GetAllOrderByIdAsync_ReturnsMappedBlog()
        {
            var blogEntity = new BlogPost
            {
                Id = "B001",
                Title = "Blog1",
                Content = "C1",
                Image = "I1",
                AuthorId = "U1",
                PostStatus = "Active",
                PublishedAt = DateTime.UtcNow
            };

            var blogDto = new ResponseDTOBlogPost
            {
                Title = "Blog1",
                Content = "C1",
                Image = "I1",
                AuthorId = "U1",
                PostStatus = "Active",
                PublishedAt = DateTime.UtcNow
            };

            _blogRepoMock.Setup(r => r.GetAllOrderByIdAsync("B001")).ReturnsAsync(blogEntity);
            _mapperMock.Setup(m => m.Map<ResponseDTOBlogPost>(blogEntity)).Returns(blogDto);

            var result = await _service.GetAllOrderByIdAsync("B001");

            Assert.NotNull(result);
            Assert.Equal("Blog1", result.Title);
            _blogRepoMock.Verify(r => r.GetAllOrderByIdAsync("B001"), Times.Once);
        }
        [Fact(DisplayName = "GetAllOrderByIdAsync - Empty id - Calls repo and returns null")]
        public async Task GetAllOrderByIdAsync_EmptyId_ReturnsNull()
        {
            _blogRepoMock.Setup(r => r.GetAllOrderByIdAsync("")).ReturnsAsync((BlogPost)null);
            _mapperMock.Setup(m => m.Map<ResponseDTOBlogPost>(It.IsAny<BlogPost>()))
                .Returns((ResponseDTOBlogPost)null);

            var result = await _service.GetAllOrderByIdAsync("");

            Assert.Null(result);
            _blogRepoMock.Verify(r => r.GetAllOrderByIdAsync(""), Times.Once);
            _mapperMock.Verify(m => m.Map<ResponseDTOBlogPost>(It.IsAny<BlogPost>()), Times.Once);
        }
        [Fact(DisplayName = "GetAllOrderByIdAsync - NotFound - Returns null")]
        public async Task GetAllOrderByIdAsync_NotFound_ReturnsNull()
        {
            _blogRepoMock.Setup(r => r.GetAllOrderByIdAsync("B999")).ReturnsAsync((BlogPost)null);
            _mapperMock.Setup(m => m.Map<ResponseDTOBlogPost>(It.IsAny<BlogPost>()))
                .Returns((ResponseDTOBlogPost)null);

            var result = await _service.GetAllOrderByIdAsync("B999");

            Assert.Null(result);
            _blogRepoMock.Verify(r => r.GetAllOrderByIdAsync("B999"), Times.Once);
            _mapperMock.Verify(m => m.Map<ResponseDTOBlogPost>(It.IsAny<BlogPost>()), Times.Once);
        }

        // -------------------------------
        // UpdateBlogPostAsync Tests
        // -------------------------------
        [Fact(DisplayName = "UpdateBlogPostAsync - Normal Case - Updates successfully")]
        public async Task UpdateBlogPostAsync_ReturnsStatus_WhenUpdated()
        {
            var blogEntity = new BlogPost { Id = "B001", Title = "OldTitle" };
            var request = new RequestUpdateBlogPost { Title = "NewTitle", Content = "NewContent", Image = "NewImage" };

            _blogRepoMock.Setup(r => r.GetAllOrderByIdAsync("B001")).ReturnsAsync(blogEntity);
            _blogRepoMock.Setup(r => r.UpdateBlogPostAsync(blogEntity, request)).ReturnsAsync("Updated");

            var result = await _service.UpdateBlogPostAsync("B001", request);

            Assert.Equal("Updated", result);
            _blogRepoMock.Verify(r => r.UpdateBlogPostAsync(blogEntity, request), Times.Once);
        }

        [Fact(DisplayName = "UpdateBlogPostAsync - Blog not found - Returns error message")]
        public async Task UpdateBlogPostAsync_ReturnsError_WhenBlogNotFound()
        {
            var request = new RequestUpdateBlogPost { Title = "NewTitle" };
            _blogRepoMock.Setup(r => r.GetAllOrderByIdAsync("INVALID")).ReturnsAsync((BlogPost)null);

            var result = await _service.UpdateBlogPostAsync("INVALID", request);

            Assert.Equal("Blog not found!", result);
            _blogRepoMock.Verify(r => r.UpdateBlogPostAsync(It.IsAny<BlogPost>(), It.IsAny<RequestUpdateBlogPost>()), Times.Never);
        }

        // UpdateBlogPostAsync trả empty string -> service trả empty string
        [Fact(DisplayName = "UpdateBlogPostAsync - Repo returns empty string - Returns empty string")]
        public async Task UpdateBlogPostAsync_RepoReturnsEmptyString_ReturnsEmptyString()
        {
            var blogEntity = new BlogPost { Id = "B001", Title = "OldTitle" };
            var request = new RequestUpdateBlogPost { Title = "NewTitle", Content = new string('x', 20), PostStatus = "Published" };

            _blogRepoMock.Setup(r => r.GetAllOrderByIdAsync("B001")).ReturnsAsync(blogEntity);
            _blogRepoMock.Setup(r => r.UpdateBlogPostAsync(blogEntity, request)).ReturnsAsync(string.Empty);

            var result = await _service.UpdateBlogPostAsync("B001", request);

            Assert.Equal(string.Empty, result);
            _blogRepoMock.Verify(r => r.UpdateBlogPostAsync(blogEntity, request), Times.Once);
        }

        // blogId = null -> service gọi repo với null; nếu repo trả null, service trả "Blog not found!"
        [Fact(DisplayName = "UpdateBlogPostAsync - Null id - Returns not found")]
        public async Task UpdateBlogPostAsync_NullId_ReturnsNotFound()
        {
            var request = new RequestUpdateBlogPost { Title = "NewTitle", Content = new string('x', 20), PostStatus = "Draft" };

            _blogRepoMock.Setup(r => r.GetAllOrderByIdAsync((string)null)).ReturnsAsync((BlogPost)null);

            var result = await _service.UpdateBlogPostAsync(null, request);

            Assert.Equal("Blog not found!", result);
            _blogRepoMock.Verify(r => r.GetAllOrderByIdAsync((string)null), Times.Once);
            _blogRepoMock.Verify(r => r.UpdateBlogPostAsync(It.IsAny<BlogPost>(), It.IsAny<RequestUpdateBlogPost>()), Times.Never);
        }

        //  blogId = empty string -> trả "Blog not found!" 
        [Fact(DisplayName = "UpdateBlogPostAsync - Empty id - Returns not found")]
        public async Task UpdateBlogPostAsync_EmptyId_ReturnsNotFound()
        {
            var request = new RequestUpdateBlogPost { Title = "NewTitle", Content = new string('x', 20), PostStatus = "Draft" };

            _blogRepoMock.Setup(r => r.GetAllOrderByIdAsync("")).ReturnsAsync((BlogPost)null);

            var result = await _service.UpdateBlogPostAsync("", request);

            Assert.Equal("Blog not found!", result);
            _blogRepoMock.Verify(r => r.GetAllOrderByIdAsync(""), Times.Once);
        }

    }
}
