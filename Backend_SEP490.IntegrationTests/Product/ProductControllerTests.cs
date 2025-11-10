using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Linq;
using Backend_SEP490.Data;
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
using ProductDetailDto = Backend_SEP490.DTOs.Request.ResponseDTOProductDetail;
using ProductFormDto = Backend_SEP490.DTOs.Response.RequestDTOProduct;
using ProductListDto = Backend_SEP490.DTOs.Request.ResponseDTOProduct;
using UserModel = global::User;
using ProductEntity = global::Product;
using Xunit;

namespace Backend_SEP490.IntegrationTests.Product;

[CollectionDefinition(nameof(ProductControllerCollection), DisableParallelization = true)]
public sealed class ProductControllerCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}

[Collection(nameof(ProductControllerCollection))]
public class ProductControllerTests
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ProductControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_products_returns_200_and_paged_items_when_products_exist()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var category = await CreateCategoryAsync(db);
        var artisan = await CreateUserAsync(db, "Artisan");
        var productId = NewId("PROD");

        db.Products.Add(new ProductEntity
        {
            Id = productId,
            Name = "Integration Test Product",
            ShortDescription = "Short description",
            LongDescription = "Long description",
            Price = 25.5m,
            Category = category.Id,
            IsActive = true,
            ArtisanId = artisan.UserID,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            Stock = 10,
            EmbeddingJson = JsonDocument.Parse("[]")
        });
        await db.SaveChangesAsync();

        try
        {
            var response = await _client.GetAsync($"/products?categoryId={category.Id}&isactive=true&pageIndex=1&pageSize=10");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var payload = await response.Content.ReadFromJsonAsync<PagedResult<ProductListDto>>();
            payload.Should().NotBeNull();
            payload!.Items.Should().Contain(p => p.Id == productId);
            payload.TotalCount.Should().BeGreaterThan(0);
        }
        finally
        {
            await CleanupProductAsync(db, productId);
            await CleanupUserAsync(db, artisan.UserID);
            await CleanupCategoryAsync(db, category.Id);
        }
    }

    [Fact]
    public async Task GET_products_returns_200_and_empty_items_when_no_match()
    {
        var response = await _client.GetAsync($"/products?categoryId={NewId("CAT")}&isactive=true&pageIndex=1&pageSize=5");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<PagedResult<ProductListDto>>();
        payload.Should().NotBeNull();
        payload!.Items.Should().BeEmpty();
        payload.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task GET_product_by_id_returns_product_detail_when_exists()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var category = await CreateCategoryAsync(db);
        var artisan = await CreateUserAsync(db, "Artisan");
        var productId = NewId("PROD");

        db.Products.Add(new ProductEntity
        {
            Id = productId,
            Name = "Detail Product",
            ShortDescription = "Short",
            LongDescription = "Long",
            Price = 15m,
            Category = category.Id,
            IsActive = true,
            ArtisanId = artisan.UserID,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            Stock = 5,
            EmbeddingJson = JsonDocument.Parse("[]")
        });
        await db.SaveChangesAsync();

        try
        {
            var response = await _client.GetAsync($"/products/{productId}");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var detail = await response.Content.ReadFromJsonAsync<ProductDetailDto>();
            detail.Should().NotBeNull();
            detail!.Id.Should().Be(productId);
            detail.ArtisanId.Should().Be(artisan.UserID);
        }
        finally
        {
            await CleanupProductAsync(db, productId);
            await CleanupUserAsync(db, artisan.UserID);
            await CleanupCategoryAsync(db, category.Id);
        }
    }

    [Fact]
    public async Task GET_product_by_id_returns_ok_with_null_when_missing()
    {
        var response = await _client.GetAsync($"/products/{NewId("PROD")}");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task POST_products_with_valid_payload_and_artisan_role_returns_ok()
    {
        using var setup = CreateClientWithProductService(new FakeProductServices());
        var client = setup.Client;
        using var request = new HttpRequestMessage(HttpMethod.Post, "/products")
        {
            Content = BuildProductForm()
        };
        request.Headers.Add("X-Test-Roles", "Artisan");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<bool>();
        payload.Should().BeTrue();
    }

    [Fact]
    public async Task POST_products_missing_required_fields_returns_bad_request()
    {
        using var setup = CreateClientWithProductService(new FakeProductServices());
        var client = setup.Client;
        using var content = new MultipartFormDataContent
        {
            { new StringContent(""), "Name" },
            { new StringContent("Short"), "ShortDescription" },
            { new StringContent("Long"), "LongDescription" },
            { new StringContent(10m.ToString(CultureInfo.InvariantCulture)), "Price" },
            { new StringContent("CAT-MISSING"), "Category" },
            { new StringContent("ARTISAN-USER"), "ArtisanId" },
            { new StringContent("3"), "Stock" }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "/products")
        {
            Content = content
        };
        request.Headers.Add("X-Test-Roles", "Artisan");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task POST_products_without_artisan_role_returns_forbidden()
    {
        using var setup = CreateClientWithProductService(new FakeProductServices());
        var client = setup.Client;
        using var request = new HttpRequestMessage(HttpMethod.Post, "/products")
        {
            Content = BuildProductForm()
        };
        request.Headers.Add("X-Test-Roles", "Customer");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task POST_products_without_token_returns_unauthorized()
    {
        using var setup = CreateClientWithProductService(new FakeProductServices());
        var client = setup.Client;
        using var request = new HttpRequestMessage(HttpMethod.Post, "/products")
        {
            Content = BuildProductForm()
        };
        request.Headers.Add("X-Test-Auth", "fail");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PUT_product_with_artisan_role_returns_ok()
    {
        using var setup = CreateClientWithProductService(new FakeProductServices());
        var client = setup.Client;
        using var request = new HttpRequestMessage(HttpMethod.Put, $"/products/{NewId("PROD")}")
        {
            Content = BuildProductForm()
        };
        request.Headers.Add("X-Test-Roles", "Artisan");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<bool>();
        payload.Should().BeTrue();
    }

    [Fact]
    public async Task PUT_product_without_required_role_returns_forbidden()
    {
        using var setup = CreateClientWithProductService(new FakeProductServices());
        var client = setup.Client;
        using var request = new HttpRequestMessage(HttpMethod.Put, $"/products/{NewId("PROD")}")
        {
            Content = BuildProductForm()
        };
        request.Headers.Add("X-Test-Roles", "Customer");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task PUT_product_service_returns_false_controller_still_returns_ok()
    {
        using var setup = CreateClientWithProductService(
            new FakeProductServices(updateHandler: (_, _) => Task.FromResult(false)));
        var client = setup.Client;

        using var request = new HttpRequestMessage(HttpMethod.Put, $"/products/{NewId("PROD")}")
        {
            Content = BuildProductForm()
        };
        request.Headers.Add("X-Test-Roles", "Artisan");

        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<bool>();
        payload.Should().BeFalse();
    }

    [Fact]
    public async Task DELETE_product_existing_sets_inactive_and_returns_no_content()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var category = await CreateCategoryAsync(db);
        var artisan = await CreateUserAsync(db, "Artisan");
        var productId = NewId("PROD");

        db.Products.Add(new ProductEntity
        {
            Id = productId,
            Name = "Delete Product",
            ShortDescription = "Short",
            LongDescription = "Long",
            Price = 30m,
            Category = category.Id,
            IsActive = true,
            ArtisanId = artisan.UserID,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            Stock = 7,
            EmbeddingJson = JsonDocument.Parse("[]")
        });
        await db.SaveChangesAsync();

        try
        {
            var response = await _client.DeleteAsync($"/products/{productId}");
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);

            var entity = await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == productId);
            entity.Should().NotBeNull();
            entity!.IsActive.Should().BeFalse();
        }
        finally
        {
            await CleanupProductAsync(db, productId);
            await CleanupUserAsync(db, artisan.UserID);
            await CleanupCategoryAsync(db, category.Id);
        }
    }

    [Fact]
    public async Task DELETE_product_with_related_order_currently_returns_no_content()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var category = await CreateCategoryAsync(db);
        var artisan = await CreateUserAsync(db, "Artisan");
        var customer = await CreateUserAsync(db, "Customer");
        var productId = NewId("PROD");
        var orderId = NewId("ORD");
        var orderItemId = NewId("OIT");

        db.Products.Add(new ProductEntity
        {
            Id = productId,
            Name = "Product with order",
            ShortDescription = "Short",
            LongDescription = "Long",
            Price = 45m,
            Category = category.Id,
            IsActive = true,
            ArtisanId = artisan.UserID,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            Stock = 20,
            EmbeddingJson = JsonDocument.Parse("[]")
        });
        db.Orders.Add(new Order
        {
            Id = orderId,
            OrderNumber = $"ORDER-{Guid.NewGuid():N}",
            CustomerId = customer.UserID,
            Status = "Pending",
            TotalAmount = 45m,
            ShipingAddressId = NewId("ADDR"),
            CreateAt = DateTime.UtcNow
        });
        db.OrderItems.Add(new OrderItem
        {
            Id = orderItemId,
            OrderID = orderId,
            ProductID = productId,
            Quantity = 1,
            UnitPrice = 45m
        });
        await db.SaveChangesAsync();

        try
        {
            var response = await _client.DeleteAsync($"/products/{productId}");
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);

            var orderItem = await db.OrderItems.AsNoTracking().FirstOrDefaultAsync(o => o.Id == orderItemId);
            orderItem.Should().NotBeNull();

            var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == productId);
            product.Should().NotBeNull();
            product!.IsActive.Should().BeFalse();
        }
        finally
        {
            await CleanupOrderAsync(db, orderId);
            await CleanupProductAsync(db, productId);
            await CleanupUserAsync(db, customer.UserID);
            await CleanupUserAsync(db, artisan.UserID);
            await CleanupCategoryAsync(db, category.Id);
        }
    }

    [Fact]
    public async Task DELETE_product_missing_returns_not_found()
    {
        using var setup = CreateClientWithProductService(
            new FakeProductServices(deleteHandler: _ => Task.FromResult(false)));
        var client = setup.Client;

        var response = await client.DeleteAsync($"/products/{NewId("PROD")}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static string NewId(string prefix) => $"{prefix}-{Guid.NewGuid():N}";

    private static async Task<Models.Category> CreateCategoryAsync(AppDbContext db, string? id = null, string? name = null)
    {
        var category = new Models.Category
        {
            Id = id ?? NewId("CAT"),
            Name = name ?? $"Category_{Guid.NewGuid().ToString("N")[..8]}"
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category;
    }

    private static async Task<UserModel> CreateUserAsync(AppDbContext db, string roleName)
    {
        var user = new UserModel
        {
            UserID = NewId("USER"),
            Username = $"user_{Guid.NewGuid().ToString("N")[..8]}",
            PasswordHash = Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            Email = $"{Guid.NewGuid().ToString("N")[..8]}@example.com",
            IsActive = true,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            DisplayName = "Integration User",
            ShopName = "Integration Shop"
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role == null)
        {
            role = new Role
            {
                Id = NewId("ROLE"),
                Name = roleName,
                Description = $"{roleName} Role"
            };
            db.Roles.Add(role);
            await db.SaveChangesAsync();
        }

        db.UserRoles.Add(new UserRole
        {
            Id = NewId("URID"),
            UserID = user.UserID,
            RoleID = role.Id
        });
        await db.SaveChangesAsync();

        return user;
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

    private static async Task CleanupUserAsync(AppDbContext db, string userId)
    {
        var userRoles = db.UserRoles.Where(ur => ur.UserID == userId);
        db.UserRoles.RemoveRange(userRoles);

        var refreshTokens = db.RefreshTokens.Where(rt => rt.UserId == userId);
        db.RefreshTokens.RemoveRange(refreshTokens);

        var user = await db.Users.FirstOrDefaultAsync(u => u.UserID == userId);
        if (user != null)
        {
            db.Users.Remove(user);
        }

        await db.SaveChangesAsync();
    }

    private static async Task CleanupProductAsync(AppDbContext db, string productId)
    {
        var productImages = db.ProductImages.Where(pi => pi.ProductId == productId);
        db.ProductImages.RemoveRange(productImages);

        var orderItems = db.OrderItems.Where(oi => oi.ProductID == productId);
        db.OrderItems.RemoveRange(orderItems);

        var wishListItems = db.WishListItems.Where(w => w.ProductID == productId);
        db.WishListItems.RemoveRange(wishListItems);

        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == productId);
        if (product != null)
        {
            db.Products.Remove(product);
        }

        await db.SaveChangesAsync();
    }

    private static async Task CleanupOrderAsync(AppDbContext db, string orderId)
    {
        var orderItems = db.OrderItems.Where(oi => oi.OrderID == orderId);
        db.OrderItems.RemoveRange(orderItems);

        var payments = db.Payments.Where(p => p.OrderID == orderId);
        db.Payments.RemoveRange(payments);

        var shipments = db.Shipments.Where(s => s.OrderID == orderId);
        db.Shipments.RemoveRange(shipments);

        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order != null)
        {
            db.Orders.Remove(order);
        }

        await db.SaveChangesAsync();
    }

    private static MultipartFormDataContent BuildProductForm(
        string name = "Sample Product",
        string category = "CAT-001",
        string artisanId = "ARTISAN-001",
        decimal price = 12.5m,
        int stock = 4,
        bool includeImages = true)
    {
        var content = new MultipartFormDataContent
        {
            { new StringContent(name), "Name" },
            { new StringContent("Short description"), "ShortDescription" },
            { new StringContent("Long description"), "LongDescription" },
            { new StringContent(price.ToString(CultureInfo.InvariantCulture)), "Price" },
            { new StringContent(category), "Category" },
            { new StringContent(artisanId), "ArtisanId" },
            { new StringContent(stock.ToString(CultureInfo.InvariantCulture)), "Stock" }
        };

        if (includeImages)
        {
            var imageBytes = new byte[] { 1, 2, 3, 4 };
            var imageContent = new ByteArrayContent(imageBytes);
            imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
            content.Add(imageContent, "Images", "test.png");
        }

        return content;
    }

    private TestClientContext CreateClientWithProductService(IProductServices productServices)
    {
        var factory = new CustomWebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IProductServices>();
                services.AddSingleton(productServices);
            });
        });

        return new TestClientContext(factory, factory.CreateClient());
    }

    private sealed class FakeProductServices : IProductServices
    {
        private readonly Func<ProductFormDto, Task<bool>> _create;
        private readonly Func<string, ProductFormDto, Task<bool>> _update;
        private readonly Func<string, Task<bool>> _delete;

        public FakeProductServices(
            Func<ProductFormDto, Task<bool>>? createHandler = null,
            Func<string, ProductFormDto, Task<bool>>? updateHandler = null,
            Func<string, Task<bool>>? deleteHandler = null)
        {
            _create = createHandler ?? (_ => Task.FromResult(true));
            _update = updateHandler ?? ((_, _) => Task.FromResult(true));
            _delete = deleteHandler ?? (_ => Task.FromResult(true));
        }

        public Task<bool> CreateProductAsync(ProductFormDto productDto) => _create(productDto);

        public Task<bool> UpdateProductAsync(string id, ProductFormDto productDto) => _update(id, productDto);

        public Task<bool> DeleteProductAsync(string productId) => _delete(productId);

        public Task<ResponseDTOProductDetail> GetProductByIdAsync(string id) => throw new NotImplementedException();

        public Task<IEnumerable<ResponseDTOProduct>> GetAvailableProductsAsync() => throw new NotImplementedException();

        public Task<IEnumerable<ResponseDTOProduct>> GetUnavailableProductsAsync() => throw new NotImplementedException();

        public Task<IEnumerable<ResponseDTOProduct>> GetAllProductsAsync() => throw new NotImplementedException();

        public Task<IEnumerable<ResponseDTOProduct>> GetProductsByArtisanIdAsync(string artisanId) => throw new NotImplementedException();

        public Task<IEnumerable<ResponseDTOProduct>> GetProductsByCategoryAsync(string categoryId) => throw new NotImplementedException();

        public Task<IEnumerable<ResponseDTOProduct>> GetProductsByNameAsync(string productName) => throw new NotImplementedException();

        public Task<PagedResult<ResponseDTOProduct>> GetProductsAsync(
            string? productName, string? categoryId, bool? isactive, int pageIndex, int pageSize, string? sortBy = null)
            => throw new NotImplementedException();
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
}
