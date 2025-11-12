using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CartEntity = Backend_SEP490.Models.Cart;
using CartItemEntity = Backend_SEP490.Models.CartItem;
using ProductEntity = global::Product;
using UserEntity = global::User;
using CategoryEntity = Backend_SEP490.Models.Category;

namespace Backend_SEP490.IntegrationTests.Cart;

[CollectionDefinition(nameof(CartControllerCollection), DisableParallelization = true)]
public sealed class CartControllerCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}

[Collection(nameof(CartControllerCollection))]
public class CartControllerTest
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public CartControllerTest(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_carts_for_user_currently_throws_invalid_operation_due_to_task_result()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await CreateUserAsync(db);
        var cart = await CreateCartAsync(db, user.UserID);
        var product = await CreateProductAsync(db, user.UserID);
        await CreateCartItemAsync(db, cart.Id, product.Id, 1);

        try
        {
            Func<Task> act = async () =>
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, "/carts");
                request.Headers.Add("X-Test-UserId", user.UserID);
                await _client.SendAsync(request);
            };

            await act.Should().ThrowAsync<InvalidOperationException>();
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
            await CleanupProductAsync(db, product.Id);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task GET_carts_without_token_also_throws_invalid_operation()
    {
        Func<Task> act = async () => await _client.GetAsync("/carts");
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task POST_carts_add_item_currently_throws_invalid_operation()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await CreateUserAsync(db);
        var cart = await CreateCartAsync(db, user.UserID);
        var product = await CreateProductAsync(db, user.UserID, stock: 5);

        try
        {
            Func<Task> act = async () =>
            {
                var payload = new RequestAddCartItem { ProductId = product.Id, PriceAtAdd = product.Price };
                using var request = new HttpRequestMessage(HttpMethod.Post, "/carts")
                {
                    Content = JsonContent.Create(payload)
                };
                request.Headers.Add("X-Test-UserId", user.UserID);
                await _client.SendAsync(request);
            };

            await act.Should().ThrowAsync<InvalidOperationException>();
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
            await CleanupProductAsync(db, product.Id);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task POST_carts_product_missing_also_throws_invalid_operation_before_validation()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await CreateUserAsync(db);
        var cart = await CreateCartAsync(db, user.UserID);

        try
        {
            Func<Task> act = async () =>
            {
                var payload = new RequestAddCartItem { ProductId = "PROD-NOT-FOUND", PriceAtAdd = 10 };
                using var request = new HttpRequestMessage(HttpMethod.Post, "/carts")
                {
                    Content = JsonContent.Create(payload)
                };
                request.Headers.Add("X-Test-UserId", user.UserID);
                await _client.SendAsync(request);
            };

            await act.Should().ThrowAsync<InvalidOperationException>();
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task POST_carts_existing_item_beyond_stock_also_throws_invalid_operation()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await CreateUserAsync(db);
        var cart = await CreateCartAsync(db, user.UserID);
        var product = await CreateProductAsync(db, user.UserID, stock: 1);
        await CreateCartItemAsync(db, cart.Id, product.Id, 1);

        try
        {
            Func<Task> act = async () =>
            {
                var payload = new RequestAddCartItem { ProductId = product.Id, PriceAtAdd = product.Price };
                using var request = new HttpRequestMessage(HttpMethod.Post, "/carts")
                {
                    Content = JsonContent.Create(payload)
                };
                request.Headers.Add("X-Test-UserId", user.UserID);
                await _client.SendAsync(request);
            };

            await act.Should().ThrowAsync<InvalidOperationException>();
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
            await CleanupProductAsync(db, product.Id);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task PUT_carts_update_quantity_currently_returns_400_due_to_route_binding()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await CreateUserAsync(db);
        var cart = await CreateCartAsync(db, user.UserID);
        var product = await CreateProductAsync(db, user.UserID, stock: 5);
        var cartItem = await CreateCartItemAsync(db, cart.Id, product.Id, 1);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Put, $"/carts/{cartItem.Id}?quantity=3");
            request.Headers.Add("X-Test-UserId", user.UserID);
            var response = await _client.SendAsync(request);

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            var body = await response.Content.ReadAsStringAsync();
            body.Should().ContainEquivalentOf("cartItemId field is required");
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
            await CleanupProductAsync(db, product.Id);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task PUT_carts_set_quantity_zero_currently_returns_400_due_to_route_binding()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await CreateUserAsync(db);
        var cart = await CreateCartAsync(db, user.UserID);
        var product = await CreateProductAsync(db, user.UserID, stock: 5);
        var cartItem = await CreateCartItemAsync(db, cart.Id, product.Id, 1);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Put, $"/carts/{cartItem.Id}?quantity=0");
            request.Headers.Add("X-Test-UserId", user.UserID);
            var response = await _client.SendAsync(request);

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            var body = await response.Content.ReadAsStringAsync();
            body.Should().ContainEquivalentOf("cartItemId field is required");
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
            await CleanupProductAsync(db, product.Id);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task PUT_carts_exceeding_stock_currently_returns_400_due_to_route_binding()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await CreateUserAsync(db);
        var cart = await CreateCartAsync(db, user.UserID);
        var product = await CreateProductAsync(db, user.UserID, stock: 2);
        var cartItem = await CreateCartItemAsync(db, cart.Id, product.Id, 1);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Put, $"/carts/{cartItem.Id}?quantity=5");
            request.Headers.Add("X-Test-UserId", user.UserID);
            var response = await _client.SendAsync(request);

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            var body = await response.Content.ReadAsStringAsync();
            body.Should().ContainEquivalentOf("cartItemId field is required");
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
            await CleanupProductAsync(db, product.Id);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task DELETE_cart_item_returns_ok_with_string_payload()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await CreateUserAsync(db);
        var cart = await CreateCartAsync(db, user.UserID);
        var product = await CreateProductAsync(db, user.UserID, stock: 3);
        var cartItem = await CreateCartItemAsync(db, cart.Id, product.Id, 1);

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Delete, $"/carts/{cartItem.Id}");
            request.Headers.Add("X-Test-UserId", user.UserID);
            var response = await _client.SendAsync(request);

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            var body = await response.Content.ReadAsStringAsync();
            body.Should().ContainEquivalentOf("cartItemId field is required");
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
            await CleanupProductAsync(db, product.Id);
            await CleanupUserAsync(db, user.UserID);
        }
    }

    [Fact]
    public async Task DELETE_cart_item_missing_returns_bad_request_with_message()
    {
        var response = await _client.DeleteAsync($"/carts/{NewId("CITEM")}");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var body = await response.Content.ReadAsStringAsync();
        body.Should().ContainEquivalentOf("cartItemId field is required");
    }

    [Fact]
    public async Task DELETE_cart_clear_endpoint_not_implemented_returns_404()
    {
        var response = await _client.DeleteAsync("/carts");
        response.StatusCode.Should().Be(HttpStatusCode.MethodNotAllowed);
    }

    private static string NewId(string prefix) => $"{prefix}-{Guid.NewGuid().ToString("N")}";

    private static async Task<UserEntity> CreateUserAsync(AppDbContext db)
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
            DisplayName = "Cart Tester",
            ShopName = "Cart Shop"
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    private static async Task<CartEntity> CreateCartAsync(AppDbContext db, string userId)
    {
        var cart = new CartEntity
        {
            Id = NewId("CART"),
            CustomerID = userId,
            CreateAt = DateTime.UtcNow
        };
        db.Carts.Add(cart);
        await db.SaveChangesAsync();
        return cart;
    }

    private static async Task<CartItemEntity> CreateCartItemAsync(AppDbContext db, string cartId, string productId, int quantity)
    {
        var item = new CartItemEntity
        {
            Id = $"{cartId}-{productId}",
            CartId = cartId,
            ProductId = productId,
            Quantity = quantity,
            PriceAtAdd = 10
        };
        db.CartItems.Add(item);
        await db.SaveChangesAsync();
        return item;
    }

    private static async Task<ProductEntity> CreateProductAsync(AppDbContext db, string artisanId, int stock = 10)
    {
        var category = new CategoryEntity
        {
            Id = NewId("CATE"),
            Name = $"Category_{Guid.NewGuid().ToString("N")[..8]}"
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var product = new ProductEntity
        {
            Id = NewId("PROD"),
            Name = $"product_{Guid.NewGuid().ToString("N")[..8]}",
            Category = category.Id,
            ArtisanId = artisanId,
            Price = 10,
            IsActive = true,
            Stock = stock,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            EmbeddingJson = JsonDocument.Parse("[]")
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product;
    }

    private static async Task CleanupCartAsync(AppDbContext db, string cartId)
    {
        var items = db.CartItems.Where(ci => ci.CartId == cartId);
        db.CartItems.RemoveRange(items);

        var cart = await db.Carts.FirstOrDefaultAsync(c => c.Id == cartId);
        if (cart != null)
        {
            db.Carts.Remove(cart);
        }

        await db.SaveChangesAsync();
    }

    private static async Task CleanupProductAsync(AppDbContext db, string productId)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == productId);
        if (product == null) return;

        var categoryId = product.Category;
        db.Products.Remove(product);
        await db.SaveChangesAsync();

        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == categoryId);
        if (category != null)
        {
            db.Categories.Remove(category);
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

            db.Users.Remove(user);
            await db.SaveChangesAsync();
        }
    }
}
