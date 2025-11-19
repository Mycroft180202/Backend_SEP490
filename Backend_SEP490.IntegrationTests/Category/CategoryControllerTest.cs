using Backend_SEP490.Models;
using Backend_SEP490.Services.impl;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using System.Net;
using System.Text;

namespace Backend_SEP490.IntegrationTests.Category
{
    public class CategoryControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly AppDbContext _db;

        public CategoryControllerTests(CustomWebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
            var scope = factory.Services.CreateScope();
            _db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        }

        [Fact(DisplayName = "AddCategory -> GetAllCategories")]
        public async Task AddCategory_Then_GetAll_ShouldContainNewCategory()
        {
            // Arrange
            var newCategory = new
            {
                Name = "IntegrationTestCategory"
            };
            var json = JsonConvert.SerializeObject(newCategory);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var postResponse = await _client.PostAsync("/categories", content);
            // Assert 
            postResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            // Act
            var getResponse = await _client.GetAsync("/categories");
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var body = await getResponse.Content.ReadAsStringAsync();
            body.Should().Contain("IntegrationTestCategory");
        }

        [Fact(DisplayName = "UpdateCategory -> GetAllCategories")]
        public async Task UpdateCategory_Then_GetAll_ShouldReflectUpdatedName()
        {
            // Arrange:
            var category = new Models.Category
            {
                Id = CategoryServicesImpl.GenerateID("CATE"),
                Name = "OldCategory"
            };
            _db.Categories.Add(category);
            await _db.SaveChangesAsync();

            var updatedCategory = new
            {
                Name = "UpdatedCategoryName"
            };
            var json = JsonConvert.SerializeObject(updatedCategory);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            // Act
            var putResponse = await _client.PutAsync($"/categories/{category.Id}", content);
            // Assert
            putResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            // Act 
            var getResponse = await _client.GetAsync("/categories");
            getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var body = await getResponse.Content.ReadAsStringAsync();
            body.Should().Contain("UpdatedCategoryName");
        }
    }
}
