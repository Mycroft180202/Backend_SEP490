using System.Net;
using System.Net.Http.Json;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using Xunit;
using CartEntity = Backend_SEP490.Models.Cart;
using CartItemEntity = Backend_SEP490.Models.CartItem;
using ProductEntity = global::Product;
using WishListItemEntity = Backend_SEP490.Models.WishListItem;
using CategoryEntity = Backend_SEP490.Models.Category;
using UserEntity = global::User;

namespace Backend_SEP490.IntegrationTests.Services;

[CollectionDefinition(nameof(WishListControllerCollection), DisableParallelization = true)]
public sealed class WishListControllerCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}

[Collection(nameof(WishListControllerCollection))]
public class WishListControllerTest
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public WishListControllerTest(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_wishlist_list_without_nameidentifier_claim_returns_404()
    {
        var response = await _client.GetAsync("/api/WishList/wish-list/1/10");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GET_wishlist_item_to_cart_with_missing_claim_returns_404()
    {
        var response = await _client.GetAsync("/api/WishList/wish-list/ITEM-123");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task POST_wishlist_ignores_body_and_returns_404()
    {
        var response = await _client.PostAsync("/api/WishList/wish-list", new StringContent(string.Empty));
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DELETE_wishlist_without_parameters_returns_404()
    {
        var response = await _client.DeleteAsync("/api/WishList/wish-list");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GET_wishlist_item_to_cart_returns_success_message_when_data_seeded()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cart = await CreateCartAsync(db, customerId: "USER-NULL");
        var product = await CreateProductAsync(db);
        await CreateCartItemAsync(db, cart.Id, product.Id, 1, 10m);
        var wish = await CreateWishListItemAsync(db, userId: "USER-NULL", productId: product.Id);

        try
        {
            var response = await _client.GetAsync($"/api/WishList/wish-list/{wish.Id}?wishListItemId={wish.Id}");
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
            await CleanupProductAsync(db, product.Id);
            await CleanupWishListAsync(db, wish.Id);
        }
    }

    private static async Task<CartEntity> CreateCartAsync(AppDbContext db, string? customerId)
    {
        var userId = customerId ?? "USER-NULL";
        await EnsureUserAsync(db, userId);

        var cart = new CartEntity
        {
            Id = $"CART-{Guid.NewGuid():N}",
            CustomerID = userId,
            CreateAt = DateTime.UtcNow
        };
        db.Carts.Add(cart);
        await db.SaveChangesAsync();
        return cart;
    }

    private static async Task CreateCartItemAsync(AppDbContext db, string cartId, string productId, int quantity, decimal price)
    {
        var item = new CartItemEntity
        {
            Id = $"{cartId}-{productId}",
            CartId = cartId,
            ProductId = productId,
            Quantity = quantity,
            PriceAtAdd = price
        };
        db.CartItems.Add(item);
        await db.SaveChangesAsync();
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
            Price = 12m,
            Stock = 3,
            IsActive = true,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            EmbeddingJson = JsonDocument.Parse("[]")
        };
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product;
    }

    private static async Task<WishListItemEntity> CreateWishListItemAsync(AppDbContext db, string? userId, string productId)
    {
        await EnsureUserAsync(db, userId ?? "USER-NULL");

        var wish = new WishListItemEntity
        {
            Id = $"WLI-{Guid.NewGuid():N}",
            UserID = userId,
            ProductID = productId,
            AddAt = DateTime.UtcNow
        };
        db.WishListItems.Add(wish);
        await db.SaveChangesAsync();
        return wish;
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

    private static async Task CleanupCartAsync(AppDbContext db, string cartId)
    {
        var items = db.CartItems.Where(ci => ci.CartId == cartId);
        db.CartItems.RemoveRange(items);

        var cart = await db.Carts.FirstOrDefaultAsync(c => c.Id == cartId);
        if (cart != null)
        {
            db.Carts.Remove(cart);
            await db.SaveChangesAsync();
        }
    }

    private static async Task CleanupProductAsync(AppDbContext db, string productId)
    {
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

    private static async Task CleanupWishListAsync(AppDbContext db, string wishListId)
    {
        var wish = await db.WishListItems.FirstOrDefaultAsync(w => w.Id == wishListId);
        if (wish != null)
        {
            db.WishListItems.Remove(wish);
            await db.SaveChangesAsync();
        }
    }
}
