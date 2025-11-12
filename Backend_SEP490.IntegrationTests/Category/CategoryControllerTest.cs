using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CategoryEntity = Backend_SEP490.Models.Category;

namespace Backend_SEP490.IntegrationTests.Category;

[CollectionDefinition(nameof(CategoryControllerCollection), DisableParallelization = true)]
public sealed class CategoryControllerCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}

[Collection(nameof(CategoryControllerCollection))]
public class CategoryControllerTest
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public CategoryControllerTest(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_categories_returns_200_with_payload()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var category = await CreateCategoryAsync(db);

        try
        {
            var response = await _client.GetAsync("/categories");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var payload = await response.Content.ReadFromJsonAsync<List<ResponseDTOCategory>>();
            payload.Should().NotBeNull();
            payload!.Any(c => c.Id == category.Id).Should().BeTrue();
        }
        finally
        {
            await CleanupCategoryAsync(db, category.Id);
        }
    }

    [Fact]
    public async Task GET_category_detail_route_not_configured_returns_405()
    {
        var response = await _client.GetAsync($"/categories/{NewId("CATE")}");
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    [Fact]
    public async Task POST_categories_as_admin_returns_ok()
    {
        var name = $"cat_{Guid.NewGuid():N}";
        var response = await _client.PostAsJsonAsync("/categories", new RequestDTOCategory { Name = name });
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        await RemoveCategoryByNameAsync(name);
    }

    [Fact]
    public async Task POST_categories_duplicate_name_currently_returns_ok_instead_of_conflict()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var category = await CreateCategoryAsync(db);

        try
        {
            var payload = new RequestDTOCategory { Name = category.Name };
            var response = await _client.PostAsJsonAsync("/categories", payload);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally
        {
            await CleanupCategoryAsync(db, category.Id);
            await RemoveCategoryByNameAsync(category.Name);
        }
    }

    [Fact]
    public async Task POST_categories_without_required_role_returns_403()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/categories")
        {
            Content = JsonContent.Create(new RequestDTOCategory { Name = $"cat_{Guid.NewGuid():N}" })
        };
        request.Headers.Add("X-Test-Roles", "Customer");

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task POST_categories_without_token_returns_401()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/categories")
        {
            Content = JsonContent.Create(new RequestDTOCategory { Name = $"cat_{Guid.NewGuid():N}" })
        };
        request.Headers.Add("X-Test-Auth", "fail");

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task POST_categories_missing_name_currently_returns_400()
    {
        var response = await _client.PostAsJsonAsync("/categories", new RequestDTOCategory { Name = null! });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PUT_categories_updates_name_and_returns_ok()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var category = await CreateCategoryAsync(db);

        try
        {
            var newName = $"updated_{Guid.NewGuid():N}";
            var response = await _client.PutAsJsonAsync($"/categories/{category.Id}",
                new RequestDTOCategory { Name = newName });

            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var refreshed = await db.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == category.Id);
            refreshed!.Name.Should().Be(newName);
        }
        finally
        {
            await CleanupCategoryAsync(db, category.Id);
        }
    }

    [Fact]
    public async Task PUT_categories_missing_entity_currently_throws_null_reference_exception()
    {
        var act = () => _client.PutAsJsonAsync($"/categories/{NewId("CATE")}",
            new RequestDTOCategory { Name = $"cat_{Guid.NewGuid():N}" });

        await act.Should().ThrowAsync<NullReferenceException>();
    }

    [Fact]
    public async Task PUT_categories_without_role_returns_403()
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, $"/categories/{NewId("CATE")}")
        {
            Content = JsonContent.Create(new RequestDTOCategory { Name = $"cat_{Guid.NewGuid():N}" })
        };
        request.Headers.Add("X-Test-Roles", "Customer");

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private static string NewId(string prefix) => $"{prefix}-{Guid.NewGuid():N}";

    private static async Task<CategoryEntity> CreateCategoryAsync(AppDbContext db, string? name = null)
    {
        var category = new CategoryEntity
        {
            Id = NewId("CATE"),
            Name = name ?? $"category_{Guid.NewGuid():N}"
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category;
    }

    private static async Task CleanupCategoryAsync(AppDbContext db, string categoryId)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == categoryId);
        if (category != null)
        {
            db.Categories.Remove(category);
            await db.SaveChangesAsync();
        }
    }

    private async Task RemoveCategoryByNameAsync(string name)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var duplicates = db.Categories.Where(c => c.Name == name);
        db.Categories.RemoveRange(duplicates);
        await db.SaveChangesAsync();
    }
}
