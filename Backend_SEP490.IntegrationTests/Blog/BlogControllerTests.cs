using Backend_SEP490.Models;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using System.Net;
using System.Text;

namespace Backend_SEP490.IntegrationTests.Blog
{
    public class BlogControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly AppDbContext _db;

        public BlogControllerTests(CustomWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            var scope = factory.Services.CreateScope();
            _db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        }

        [Fact(DisplayName = "Create Blog -> Get All should include new blog")]
        public async Task CreateBlog_Then_GetAll_ShouldContainNewBlog()
        {
            // Arrange
            var request = new
            {
                Title = "IntegrationTest_Blog1",
                Content = "This is test content",
                Image = "test-image.jpg",
                PostStatus = "Draft",
                PublishedAt = DateTime.UtcNow
            };

            var content = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");

            // Act
            var createResponse = await _client.PostAsync("/blogs", content);
            createResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var getResponse = await _client.GetAsync("/blogs/1/10");
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var body = await getResponse.Content.ReadAsStringAsync();
            body.Should().Contain("IntegrationTest_Blog1");
        }

        [Fact(DisplayName = "Update Blog -> Get All should reflect updated title")]
        public async Task UpdateBlog_Then_GetAll_ShouldReflectUpdatedTitle()
        {
            // Arrange
            var blog = new BlogPost
            {
                Id = $"BLOG-{DateTime.UtcNow:yyyyMMddHHmmss}",
                Title = "OldTitle",
                Content = "Old content",
                AuthorId = "USER-20251022-095607",
                Image = "old.jpg",
                PostStatus = "Draft",
                PublishedAt = DateTime.UtcNow
            };
            try
            {
                _db.BlogPosts.Add(blog);
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {

                throw new Exception(ex.Message);
            }

            var updatePayload = new
            {
                Title = "UpdatedBlogTitle",
                Content = "Updated content",
                Image = "new.jpg",
                PostStatus = "Active"
            };

            var content = new StringContent(JsonConvert.SerializeObject(updatePayload), Encoding.UTF8, "application/json");

            // Act
            var updateResponse = await _client.PutAsync($"/blogs/{blog.Id}", content);
            updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var getResponse = await _client.GetAsync($"/blogs/{blog!.Id}");
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var body = await getResponse.Content.ReadAsStringAsync();
            body.Should().Contain("UpdatedBlogTitle");
        }

        [Fact(DisplayName = "Create Blog -> Get Detail should return same blog")]
        public async Task CreateBlog_Then_GetDetail_ShouldReturnSameBlog()
        {
            // Arrange
            var request = new
            {
                Title = "IntegrationTest_Blog_Detail",
                Content = "Detail content test",
                Image = "detail.jpg",
                AuthorId = "USER-TEST",
                PostStatus = "Draft",
                PublishedAt = DateTime.UtcNow
            };

            var content = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");

            // Act
            var createResponse = await _client.PostAsync("/blogs", content);
            createResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var createdBlog = _db.BlogPosts.FirstOrDefault(b => b.Title == "IntegrationTest_Blog_Detail");
            createdBlog.Should().NotBeNull();

            var getResponse = await _client.GetAsync($"/blogs/{createdBlog!.Id}");
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var body = await getResponse.Content.ReadAsStringAsync();
            body.Should().Contain("IntegrationTest_Blog_Detail");
        }

        [Fact(DisplayName = "Update Blog -> Get Detail should reflect updated title")]
        public async Task UpdateBlog_Then_GetDetail_ShouldReflectUpdatedTitle()
        {
            // Arrange
            var blog = new BlogPost
            {
                Id = $"BLOG-{DateTime.UtcNow:yyyyMMddHHmmss}",
                Title = "BeforeUpdate",
                Content = "Before update",
                Image = "before.jpg",
                AuthorId = "USER-TEST",
                PostStatus = "Draft",
                PublishedAt = DateTime.UtcNow
            };

            _db.BlogPosts.Add(blog);
            await _db.SaveChangesAsync();

            var updatePayload = new
            {
                Title = "AfterUpdateTitle",
                Content = "After update content",
                Image = "after.jpg",
                PostStatus = "Published"
            };

            var content = new StringContent(JsonConvert.SerializeObject(updatePayload), Encoding.UTF8, "application/json");

            // Act
            var updateResponse = await _client.PutAsync($"/blogs/{blog.Id}", content);
            updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var getResponse = await _client.GetAsync($"/blogs/{blog.Id}");
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var body = await getResponse.Content.ReadAsStringAsync();
            body.Should().Contain("AfterUpdateTitle");
        }
    }
}
