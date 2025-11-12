using System.Collections.Generic;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ProductCollectionEntity = global::ProductCollection;
using ProductEntity = global::Product;
using UserEntity = global::User;

namespace Backend_SEP490.IntegrationTests.ProductCollection;

[CollectionDefinition(nameof(ProductCollectionControllerCollection), DisableParallelization = true)]
public sealed class ProductCollectionControllerCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}

[Collection(nameof(ProductCollectionControllerCollection))]
public class ProductCollectionTest
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ProductCollectionTest(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_productcollection_returns_200_with_items()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await EnsureUserAsync(db);
        var collection = await CreateCollectionAsync(db, user.UserID);

        try
        {
            var response = await _client.GetAsync("/productcollection");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var payload = await response.Content.ReadFromJsonAsync<List<ResponseDTOProductCollection>>();
            payload.Should().NotBeNull();
            payload!.Any(pc => pc.ProductCollectionId == collection.ProductCollectionId).Should().BeTrue();
        }
        finally
        {
            await CleanupCollectionAsync(db, collection.ProductCollectionId);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task GET_productcollection_by_id_returns_200_when_found()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await EnsureUserAsync(db);
        var collection = await CreateCollectionAsync(db, user.UserID);

        try
        {
            var response = await _client.GetAsync($"/productcollection/{collection.ProductCollectionId}");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var detail = await response.Content.ReadFromJsonAsync<ResponseDTOProductCollectionDetail>();
            detail.Should().NotBeNull();
            detail!.ProductCollectionId.Should().Be(collection.ProductCollectionId);
        }
        finally
        {
            await CleanupCollectionAsync(db, collection.ProductCollectionId);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task GET_productcollection_missing_currently_throws_null_reference_exception()
    {
        var act = () => _client.GetAsync($"/productcollection/{int.MaxValue}");
        await act.Should().ThrowAsync<NullReferenceException>();
    }

    [Fact]
    public async Task POST_productcollection_payload_without_existing_products_returns_400()
    {
        using var setup = CreateClientWithProductCollectionService(new FakeProductCollectionServices());
        var client = setup.Client;
        using var request = new HttpRequestMessage(HttpMethod.Post, "/productcollection")
        {
            Content = BuildCreateForm()
        };

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task POST_productcollection_duplicate_title_still_returns_400()
    {
        using var setup = CreateClientWithProductCollectionService(new FakeProductCollectionServices());
        var client = setup.Client;
        using var first = new HttpRequestMessage(HttpMethod.Post, "/productcollection")
        {
            Content = BuildCreateForm(title: "duplicate-title")
        };

        var firstResponse = await client.SendAsync(first);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var second = new HttpRequestMessage(HttpMethod.Post, "/productcollection")
        {
            Content = BuildCreateForm(title: "duplicate-title")
        };

        var secondResponse = await client.SendAsync(second);
        secondResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task POST_productcollection_without_required_role_returns_403()
    {
        using var setup = CreateClientWithProductCollectionService(new FakeProductCollectionServices());
        var client = setup.Client;
        using var request = new HttpRequestMessage(HttpMethod.Post, "/productcollection")
        {
            Content = BuildCreateForm()
        };
        request.Headers.Add("X-Test-Roles", "Customer");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task POST_productcollection_without_token_returns_401()
    {
        using var setup = CreateClientWithProductCollectionService(new FakeProductCollectionServices());
        var client = setup.Client;
        using var request = new HttpRequestMessage(HttpMethod.Post, "/productcollection")
        {
            Content = BuildCreateForm()
        };
        request.Headers.Add("X-Test-Auth", "fail");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PUT_productcollection_updates_and_returns_ok()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await EnsureUserAsync(db);
        var collection = await CreateCollectionAsync(db, user.UserID);
        var product = await CreateProductAsync(db, user.UserID);

        try
        {
            var dto = new RequestDTOUpdateProductCollection
            {
                ProductCollectionId = collection.ProductCollectionId,
                Title = "updated title",
                ProductIds = new List<string> { product.Id }
            };

            using var request = new HttpRequestMessage(HttpMethod.Put, $"/productcollection/{collection.ProductCollectionId}")
            {
                Content = JsonContent.Create(dto)
            };
            request.Headers.Add("X-Test-UserId", user.UserID);

            var response = await _client.SendAsync(request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var refreshed = await db.ProductCollections.Include(pc => pc.ProductCollectionItems)
                .AsNoTracking()
                .FirstAsync(pc => pc.ProductCollectionId == collection.ProductCollectionId);
            refreshed.Title.Should().Be("updated title");
            refreshed.ProductCollectionItems.Should().Contain(p => p.Id == product.Id);
        }
        finally
        {
            await CleanupCollectionAsync(db, collection.ProductCollectionId);
            await CleanupProductAsync(db, product.Id);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task PUT_productcollection_missing_returns_not_found()
    {
        var dto = new RequestDTOUpdateProductCollection
        {
            ProductCollectionId = int.MaxValue,
            Title = "will fail",
            ProductIds = new List<string> { "PROD-XYZ" }
        };

        using var request = new HttpRequestMessage(HttpMethod.Put, $"/productcollection/{dto.ProductCollectionId}")
        {
            Content = JsonContent.Create(dto)
        };
        request.Headers.Add("X-Test-UserId", "USER-TEST-UPDATE");

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PUT_productcollection_without_role_returns_403()
    {
        var dto = new RequestDTOUpdateProductCollection
        {
            ProductCollectionId = 1,
            Title = "ignored",
            ProductIds = new List<string>()
        };

        using var request = new HttpRequestMessage(HttpMethod.Put, "/productcollection/1")
        {
            Content = JsonContent.Create(dto)
        };
        request.Headers.Add("X-Test-Roles", "Customer");

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DELETE_productcollection_success_returns_ok_and_deactivates()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await EnsureUserAsync(db);
        var collection = await CreateCollectionAsync(db, user.UserID);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Delete, $"/productcollection/{collection.ProductCollectionId}");
            request.Headers.Add("X-Test-UserId", user.UserID);

            var response = await _client.SendAsync(request);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var refreshed = await db.ProductCollections.AsNoTracking()
                .FirstAsync(pc => pc.ProductCollectionId == collection.ProductCollectionId);
            refreshed.IsActive.Should().BeFalse();
        }
        finally
        {
            await CleanupCollectionAsync(db, collection.ProductCollectionId);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task DELETE_productcollection_missing_returns_not_found()
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"/productcollection/{int.MaxValue}");
        request.Headers.Add("X-Test-UserId", "USER-DELETE-TEST");

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DELETE_productcollection_without_role_returns_403()
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, "/productcollection/1");
        request.Headers.Add("X-Test-Roles", "Customer");

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private static MultipartFormDataContent BuildCreateForm(string title = "New Collection")
    {
        var form = new MultipartFormDataContent();
        form.Add(new StringContent(title, Encoding.UTF8), nameof(RequestDTOCreateProductCollection.Title));
        form.Add(new StringContent("Headline", Encoding.UTF8), nameof(RequestDTOCreateProductCollection.Headline));
        form.Add(new StringContent("Content", Encoding.UTF8), nameof(RequestDTOCreateProductCollection.Content));
        form.Add(new StringContent("PROD-SAMPLE", Encoding.UTF8), $"{nameof(RequestDTOCreateProductCollection.ProductIds)}[0]");

        var fileBytes = Encoding.UTF8.GetBytes("fake-image");
        var fileContent = new ByteArrayContent(fileBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(fileContent, nameof(RequestDTOCreateProductCollection.ImageFile), "image.png");

        return form;
    }

    private TestClientContext CreateClientWithProductCollectionService(IProductCollectionServices service)
    {
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IProductCollectionServices>();
                services.AddSingleton(service);
            });
        });

        return new TestClientContext(factory, factory.CreateClient());
    }

    private static string NewId(string prefix) => $"{prefix}-{Guid.NewGuid().ToString("N")}";

    private static async Task<UserEntity> EnsureUserAsync(AppDbContext db)
    {
        var user = new UserEntity
        {
            UserID = NewId("USER"),
            Username = $"user_{Guid.NewGuid().ToString("N")[..8]}",
            PasswordHash = Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            Email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com",
            IsActive = true,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            DisplayName = "Collection Tester",
            ShopName = "Integration Shop"
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        return user;
    }

    private static async Task<ProductCollectionEntity> CreateCollectionAsync(AppDbContext db, string? createdById = null)
    {
        var entity = new ProductCollectionEntity
        {
            Title = $"collection_{Guid.NewGuid().ToString("N")}",
            Content = "content",
            Headline = "headline",
            CreatedDate = DateTime.UtcNow,
            CreatedById = createdById,
            Image = "https://example.com/image.png",
            IsActive = true
        };

        db.ProductCollections.Add(entity);
        await db.SaveChangesAsync();
        return entity;
    }

    private static async Task CleanupCollectionAsync(AppDbContext db, int id)
    {
        var collection = await db.ProductCollections.FirstOrDefaultAsync(pc => pc.ProductCollectionId == id);
        if (collection != null)
        {
            db.ProductCollections.Remove(collection);
            await db.SaveChangesAsync();
        }
    }

    private static async Task CleanupUserAsync(AppDbContext db, string userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserID == userId);
        if (user != null)
        {
            var roles = db.UserRoles.Where(ur => ur.UserID == userId);
            db.UserRoles.RemoveRange(roles);

            var carts = db.Carts.Where(c => c.CustomerID == userId);
            db.Carts.RemoveRange(carts);

            db.Users.Remove(user);
            await db.SaveChangesAsync();
        }
    }

    private static async Task<ProductEntity> CreateProductAsync(AppDbContext db, string artisanId)
    {
        var product = new ProductEntity
        {
            Id = NewId("PROD"),
            Name = $"product_{Guid.NewGuid().ToString("N")[..8]}",
            Category = "CAT_001",
            ArtisanId = artisanId,
            Price = 10,
            IsActive = true,
            Stock = 5,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            EmbeddingJson = JsonDocument.Parse("[]")
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product;
    }

    private static async Task CleanupProductAsync(AppDbContext db, string productId)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == productId);
        if (product != null)
        {
            db.Products.Remove(product);
            await db.SaveChangesAsync();
        }
    }

    private sealed class TestClientContext : IDisposable
    {
        public WebApplicationFactory<Program> Factory { get; }
        public HttpClient Client { get; }

        public TestClientContext(WebApplicationFactory<Program> factory, HttpClient client)
        {
            Factory = factory;
            Client = client;
        }

        public void Dispose()
        {
            Client.Dispose();
            Factory.Dispose();
        }
    }

    private sealed class FakeProductCollectionServices : IProductCollectionServices
    {
        public Task<IEnumerable<ResponseDTOProductCollection>> GetAllProducts() =>
            Task.FromResult<IEnumerable<ResponseDTOProductCollection>>(Array.Empty<ResponseDTOProductCollection>());

        public Task<ResponseDTOProductCollectionDetail> GetProductCollectionById(int id) =>
            Task.FromResult<ResponseDTOProductCollectionDetail>(null!);

        public Task<ProductCollectionEntity> CreateAsync(RequestDTOCreateProductCollection dto) =>
            Task.FromResult(new ProductCollectionEntity
            {
                ProductCollectionId = 1,
                Title = dto.Title ?? "Untitled",
                Image = "https://example.com/fake.png",
                CreatedDate = DateTime.UtcNow,
                IsActive = true
            });

        public Task<bool> SoftDeleteProductCollectionAsync(int id, string updatedByUserId) =>
            Task.FromResult(true);

        public Task<bool> UpdateProductCollectionAsync(RequestDTOUpdateProductCollection dto, string updatedById) =>
            Task.FromResult(true);
    }
}
