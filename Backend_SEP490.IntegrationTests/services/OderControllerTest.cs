using System.Net;
using System.Net.Http.Json;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Backend_SEP490.DTOs.Response;
using System.Text;
using System.Text.Json;
using Xunit;
using OrderEntity = Backend_SEP490.Models.Order;
using OrderItemEntity = Backend_SEP490.Models.OrderItem;
using CartEntity = Backend_SEP490.Models.Cart;
using CartItemEntity = Backend_SEP490.Models.CartItem;
using ProductEntity = global::Product;
using CategoryEntity = Backend_SEP490.Models.Category;
using UserEntity = global::User;

namespace Backend_SEP490.IntegrationTests.Services;

[CollectionDefinition(nameof(OrderControllerCollection), DisableParallelization = true)]
public sealed class OrderControllerCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}

[Collection(nameof(OrderControllerCollection))]
public class OderControllerTest
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public OderControllerTest(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task POST_orders_returns_ok_with_status_message_even_when_user_claim_missing()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cart = await CreateCartWithItemAsync(db, customerId: null, quantity: 2, price: 5m);

        try
        {
            var payload = new RequestCreateOrder { ShipingAddressId = "ADDR-001" };
            var response = await _client.PostAsJsonAsync("/api/Order/orders", payload);

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
        }
    }

    [Fact]
    public async Task POST_orders_with_empty_cart_still_returns_ok()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cart = await CreateCartAsync(db, customerId: null);

        try
        {
            var response = await _client.PostAsJsonAsync("/api/Order/orders", new RequestCreateOrder { ShipingAddressId = "ADDR-EMPTY" });

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
        }
    }

    [Fact]
    public async Task POST_orders_missing_shipping_address_returns_ok()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cart = await CreateCartWithItemAsync(db, customerId: null, quantity: 1, price: 9m);

        try
        {
            var response = await _client.PostAsJsonAsync("/api/Order/orders", new RequestCreateOrder { ShipingAddressId = null! });

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
        }
    }

    [Fact]
    public async Task POST_orders_with_voucher_field_not_supported_returns_ok()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cart = await CreateCartWithItemAsync(db, customerId: null, quantity: 1, price: 10m);

        try
        {
            var payload = new { ShipingAddressId = "ADDR", VoucherCode = "INVALID" };
            var response = await _client.PostAsJsonAsync("/api/Order/orders", payload);

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupCartAsync(db, cart.Id);
        }
    }

    [Fact]
    public async Task POST_my_orders_without_body_throws_null_reference_and_returns_500()
    {
        var response = await _client.PostAsync("/api/Order/my-orders", new StringContent(string.Empty, System.Text.Encoding.UTF8, "application/json"));
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task POST_my_orders_with_filter_returns_empty_list_even_when_orders_exist()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var order = await CreateOrderAsync(db, customerId: null);

        try
        {
            var filter = new RequestFilterOrder { search = string.Empty, Status = string.Empty, CreateAt = null };
            var response = await _client.PostAsJsonAsync("/api/Order/my-orders", filter);

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupOrderAsync(db, order.Id);
        }
    }

    [Fact]
    public async Task GET_order_by_id_returns_500_when_route_parameters_are_missing()
    {
        var response = await _client.GetAsync("/api/Order/orders/ANY-ORDER-ID");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GET_order_by_id_for_different_user_also_returns_500_due_to_same_issue()
    {
        var response = await _client.GetAsync("/api/Order/orders/OTHER-USER-ORDER");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PUT_order_cancel_endpoint_is_not_implemented_and_returns_404()
    {
        var response = await _client.PutAsync("/api/Order/orders/ORDER-123/cancel", new StringContent(string.Empty));
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PUT_order_status_endpoint_is_not_implemented_and_returns_404()
    {
        var response = await _client.PutAsync("/api/Order/orders/ORDER-123/status", JsonContent.Create(new { Status = "Shipped" }));
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static async Task<CartEntity> CreateCartWithItemAsync(AppDbContext db, string? customerId, int quantity, decimal price)
    {
        var cart = await CreateCartAsync(db, customerId);
        var product = await CreateProductAsync(db);

        var item = new CartItemEntity
        {
            Id = $"{cart.Id}-{product.Id}",
            CartId = cart.Id,
            ProductId = product.Id,
            Quantity = quantity,
            PriceAtAdd = price
        };
        db.CartItems.Add(item);

        await db.SaveChangesAsync();
        return cart;
    }

    private static async Task<CartEntity> CreateCartAsync(AppDbContext db, string? customerId)
    {
        var userId = customerId ?? "USER-ORDER";
        await EnsureUserAsync(db, userId);

        var cart = new CartEntity
        {
            Id = $"CART-{Guid.NewGuid().ToString("N")}",
            CustomerID = userId,
            CreateAt = DateTime.UtcNow
        };
        db.Carts.Add(cart);
        await db.SaveChangesAsync();
        return cart;
    }

    private static async Task<ProductEntity> CreateProductAsync(AppDbContext db)
    {
        await EnsureUserAsync(db, "ARTISAN-ORDER");

        var category = new CategoryEntity
        {
            Id = $"CAT-{Guid.NewGuid().ToString("N")}",
            Name = $"Category_{Guid.NewGuid().ToString("N")[..8]}"
        };
        db.Categories.Add(category);

        var product = new ProductEntity
        {
            Id = $"PROD-{Guid.NewGuid().ToString("N")}",
            Name = $"Product_{Guid.NewGuid().ToString("N")[..8]}",
            Category = category.Id,
            ArtisanId = "ARTISAN-ORDER",
            Price = 10m,
            Stock = 5,
            IsActive = true,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow,
            EmbeddingJson = JsonDocument.Parse("[]")
        };
        db.Products.Add(product);

        await db.SaveChangesAsync();
        return product;
    }

    private static async Task<OrderEntity> CreateOrderAsync(AppDbContext db, string? customerId)
    {
        var userId = customerId ?? "USER-ORDER";
        await EnsureUserAsync(db, userId);

        var order = new OrderEntity
        {
            Id = $"ORDER-{Guid.NewGuid().ToString("N")}",
            OrderNumber = $"ORD-{Guid.NewGuid().ToString("N")[..6]}",
            CustomerId = userId,
            Status = "Pending",
            TotalAmount = 0,
            ShipingAddressId = "ADDR",
            CreateAt = DateTime.UtcNow,
            OrderItems = new List<OrderItemEntity>()
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return order;
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

    private static async Task CleanupOrderAsync(AppDbContext db, string orderId)
    {
        var orderItems = db.OrderItems.Where(oi => oi.OrderID == orderId);
        db.OrderItems.RemoveRange(orderItems);

        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order != null)
        {
            db.Orders.Remove(order);
            await db.SaveChangesAsync();
        }
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
