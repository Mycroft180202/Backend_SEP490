using System.Net;
using System.Net.Http.Json;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using Xunit;
using ProductEntity = global::Product;
using FeedbackEntity = Backend_SEP490.Models.Feedback;
using CategoryEntity = Backend_SEP490.Models.Category;
using UserEntity = global::User;

namespace Backend_SEP490.IntegrationTests.Services;

[CollectionDefinition(nameof(FeedbackControllerCollection), DisableParallelization = true)]
public sealed class FeedbackControllerCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}

[Collection(nameof(FeedbackControllerCollection))]
public class FeedbackControllerTest
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public FeedbackControllerTest(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_feedbacks_currently_returns_404_even_when_data_exists()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var product = await CreateProductAsync(db);
        await CreateFeedbackAsync(db, product.Id, "USER-A", 4, "Good");

        try
        {
            var response = await _client.GetAsync($"/api/Feedback/feedbacks/{product.Id}");
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupProductAsync(db, product.Id);
        }
    }

    [Fact]
    public async Task POST_feedback_without_attributes_currently_returns_404()
    {
        var dto = new RequestDTOFeedback { Rating = 5, Comment = "Great" };
        var response = await _client.PostAsJsonAsync("/api/Feedback/feedbacks?productid=PROD-X&userid=USER-X", dto);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PUT_feedback_without_route_parameters_currently_returns_404()
    {
        var dto = new RequestDTOFeedback { Rating = 3, Comment = "Updated" };
        var response = await _client.PutAsJsonAsync("/api/Feedback/feedbacks?productid=PROD-X&userid=USER-X&feedbackid=FDB-1", dto);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DELETE_feedback_with_stubbed_entity_returns_404_even_if_not_owner()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var product = await CreateProductAsync(db);
        var feedback = await CreateFeedbackAsync(db, product.Id, "USER-B", 2, "Fair");

        try
        {
            var response = await _client.DeleteAsync($"/api/Feedback/feedbacks/{feedback.Id}");
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupProductAsync(db, product.Id);
        }
    }

    private static async Task<ProductEntity> CreateProductAsync(AppDbContext db)
    {
        var category = new CategoryEntity
        {
            Id = $"CAT-{Guid.NewGuid():N}",
            Name = $"Category_{Guid.NewGuid().ToString("N")[..6]}"
        };
        db.Categories.Add(category);

        await EnsureUserAsync(db, "ARTISAN-001");

        var product = new ProductEntity
        {
            Id = $"PROD-{Guid.NewGuid():N}",
            Name = $"Product_{Guid.NewGuid().ToString("N")[..6]}",
            Category = category.Id,
            ArtisanId = "ARTISAN-001",
            Price = 15m,
            Stock = 10,
            IsActive = true,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            EmbeddingJson = JsonDocument.Parse("[]")
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product;
    }

    private static async Task<FeedbackEntity> CreateFeedbackAsync(AppDbContext db, string productId, string userId, int rating, string comment)
    {
        await EnsureUserAsync(db, userId);

        var feedback = new FeedbackEntity
        {
            Id = $"FDB-{Guid.NewGuid():N}",
            ProductId = productId,
            CustomerId = userId,
            Rating = rating,
            Comment = comment,
            CreateAt = DateTime.UtcNow
        };
        db.Feedbacks.Add(feedback);
        await db.SaveChangesAsync();
        return feedback;
    }

    private static async Task CleanupProductAsync(AppDbContext db, string productId)
    {
        var feedbacks = db.Feedbacks.Where(f => f.ProductId == productId);
        db.Feedbacks.RemoveRange(feedbacks);

        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == productId);
        if (product == null) return;

        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == product.Category);
        db.Products.Remove(product);
        if (category != null)
        {
            db.Categories.Remove(category);
        }

        await db.SaveChangesAsync();
    }

    private static async Task EnsureUserAsync(AppDbContext db, string userId)
    {
        if (await db.Users.AnyAsync(u => u.UserID == userId))
        {
            return;
        }

        var user = new UserEntity
        {
            UserID = userId,
            Username = $"user_{Guid.NewGuid().ToString("N")[..8]}",
            PasswordHash = Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            Email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com",
            IsActive = true,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
    }
}
