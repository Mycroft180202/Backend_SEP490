using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using CartEntity = Backend_SEP490.Models.Cart;
using CartItemEntity = Backend_SEP490.Models.CartItem;
using CategoryEntity = Backend_SEP490.Models.Category;
using OrderEntity = Backend_SEP490.Models.Order;
using OrderItemEntity = Backend_SEP490.Models.OrderItem;
using ProductEntity = global::Product;
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
    public async Task POST_orders_creates_order_and_returns_success_message()
    {
        var userId = $"USER-ORDER-{Guid.NewGuid():N}";
        SetAuthenticatedUser(userId);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var (cart, product) = await CreateCartWithItemAsync(db, userId, quantity: 2, price: 5m);
        var address = await CreateAddressForUserAsync(db, userId);

        try
        {
            var payload = BuildValidOrderRequest(address.Id, product.Id, quantity: 2);
            var response = await _client.PostAsJsonAsync("/api/Order/orders", payload);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var result = await response.Content.ReadFromJsonAsync<CreateOrderResult>();
            result.Should().NotBeNull();
            result!.Success.Should().BeTrue();
            result.PaymentMethod.Should().Be("COD");

            var order = await db.Orders
                .AsNoTracking()
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.CustomerId == userId);

            order.Should().NotBeNull();
            order!.ShipingAddressId.Should().NotBeNullOrWhiteSpace();
            order.PaymentType.Should().Be(payload.PaymentMethod);
            order.SubtotalAmount.Should().Be(10m);
            order.DiscountAmount.Should().Be(0m);
            order.TotalAmount.Should().Be(order.SubtotalAmount - order.DiscountAmount + order.ShippingFee);
            order.OrderItems.Should().ContainSingle();
            order.OrderItems.Single().Quantity.Should().Be(2);

            var storedAddress = await db.Addresses.AsNoTracking().FirstOrDefaultAsync(a => a.Id == order.ShipingAddressId);
            storedAddress.Should().NotBeNull();
            storedAddress!.Line1.Should().Be(address.Line1);
            storedAddress.ContactName.Should().Be(address.ContactName);
            storedAddress.ContactPhone.Should().Be(address.ContactPhone);
        }
        finally
        {
            await CleanupOrdersByCustomerAsync(db, userId);
            await CleanupCartAsync(db, cart.Id);
        }
    }

    [Fact]
    public async Task POST_orders_accepts_unknown_fields_and_returns_success()
    {
        var userId = $"USER-ORDER-{Guid.NewGuid():N}";
        SetAuthenticatedUser(userId);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var (cart, product) = await CreateCartWithItemAsync(db, userId, quantity: 1, price: 10m);
        var address = await CreateAddressForUserAsync(db, userId);

        try
        {
            var payload = JsonContent.Create(new
            {
                addressId = address.Id,
                paymentMethod = "VNPAY",
                shippingServiceId = 53320,
                paymentTypeId = 2,
                serviceTypeId = 2,
                requiredNote = "KHONGCHOXEMHANG",
                voucherCodeId = "INVALID",
                cartItems = new[]
                {
                    new { productId = product.Id, quantity = 1 }
                },
                extraField = "ignored"
            });
            var response = await _client.PostAsync("/api/Order/orders", payload);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var result = await response.Content.ReadFromJsonAsync<CreateOrderResult>();
            result.Should().NotBeNull();
            result!.Success.Should().BeTrue();
        }
        finally
        {
            await CleanupOrdersByCustomerAsync(db, userId);
            await CleanupCartAsync(db, cart.Id);
        }
    }

    [Fact]
    public async Task POST_my_orders_with_filter_returns_user_orders()
    {
        var userId = $"USER-ORDER-{Guid.NewGuid():N}";
        SetAuthenticatedUser(userId);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var (cart, product) = await CreateCartWithItemAsync(db, userId, quantity: 1, price: 9m);
        var address = await CreateAddressForUserAsync(db, userId);

        try
        {
            var createOrderResponse = await _client.PostAsJsonAsync("/api/Order/orders", BuildValidOrderRequest(address.Id, product.Id));
            createOrderResponse.EnsureSuccessStatusCode();

            var filter = new RequestFilterOrder
            {
                search = string.Empty,
                Status = "Pending",
                CreateAt = null
            };

            var response = await _client.PostAsJsonAsync("/api/Order/my-orders", filter);
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var orders = await response.Content.ReadFromJsonAsync<List<ResponseDTOOrder>>();
            orders.Should().NotBeNull();
            orders!.Any(o => o.CustomerId == userId).Should().BeTrue();
        }
        finally
        {
            await CleanupOrdersByCustomerAsync(db, userId);
            await CleanupCartAsync(db, cart.Id);
        }
    }

    [Fact]
    public async Task GET_orders_by_id_returns_order_details_with_pagination()
    {
        var userId = $"USER-ORDER-{Guid.NewGuid():N}";
        SetAuthenticatedUser(userId);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var (cart, product) = await CreateCartWithItemAsync(db, userId, quantity: 3, price: 7m);
        var address = await CreateAddressForUserAsync(db, userId);

        try
        {
            var createOrderResponse = await _client.PostAsJsonAsync("/api/Order/orders", BuildValidOrderRequest(address.Id, product.Id));
            createOrderResponse.EnsureSuccessStatusCode();

            var order = await db.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.CustomerId == userId);
            order.Should().NotBeNull();

            var response = await _client.GetAsync($"/api/Order/orders/{order!.Id}?pageIndex=1&pageSize=10");
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var dto = await response.Content.ReadFromJsonAsync<ResponseDTOOrder>();
            dto.Should().NotBeNull();
            dto!.CustomerId.Should().Be(userId);
            dto.PaymentType.Should().Be("COD");
            dto.ShipingAddressId.Should().NotBeNullOrWhiteSpace();
            dto.Items.Should().NotBeNull();
            dto.Items.Should().NotBeEmpty();
        }
        finally
        {
            await CleanupOrdersByCustomerAsync(db, userId);
            await CleanupCartAsync(db, cart.Id);
        }
    }

    private static RequestCreateOrder BuildValidOrderRequest(string addressId, string productId, int quantity = 1)
    {
        return new RequestCreateOrder
        {
            AddressId = addressId,
            PaymentMethod = "COD",
            ShippingServiceId = 53320,
            PaymentTypeId = 2,
            ServiceTypeId = 2,
            RequiredNote = "KHONGCHOXEMHANG",
            CartItems = new List<RequestCreateOrderItem>
            {
                new() { ProductId = productId, Quantity = quantity }
            }
        };
    }

    private void SetAuthenticatedUser(string userId)
    {
        _client.DefaultRequestHeaders.Remove("X-Test-Auth");
        _client.DefaultRequestHeaders.Remove("X-Test-UserId");
        _client.DefaultRequestHeaders.Add("X-Test-Auth", "success");
        _client.DefaultRequestHeaders.Add("X-Test-UserId", userId);
    }

    private static async Task CleanupOrdersByCustomerAsync(AppDbContext db, string customerId)
    {
        var orderIds = await db.Orders
            .Where(o => o.CustomerId == customerId)
            .Select(o => o.Id)
            .ToListAsync();

        foreach (var orderId in orderIds)
        {
            await CleanupOrderAsync(db, orderId);
        }

        await CleanupAddressesAsync(db, customerId);
    }

    private static async Task<(CartEntity Cart, ProductEntity Product)> CreateCartWithItemAsync(AppDbContext db, string customerId, int quantity, decimal price)
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
        return (cart, product);
    }

    private static async Task<Address> CreateAddressForUserAsync(AppDbContext db, string userId)
    {
        await EnsureUserAsync(db, userId);

        var address = new Address
        {
            Id = $"ADDR-{Guid.NewGuid():N}",
            UserID = userId,
            Line1 = "123 Test Street",
            City = "Ho Chi Minh",
            Country = "Vietnam",
            ContactName = "Test Receiver",
            ContactPhone = "0900000000",
            GhnProvinceId = 1,
            GhnDistrictId = 1450,
            GhnWardCode = "00001",
            IsDefault = true
        };

        db.Addresses.Add(address);
        await db.SaveChangesAsync();
        return address;
    }

    private static async Task<CartEntity> CreateCartAsync(AppDbContext db, string customerId)
    {
        await EnsureUserAsync(db, customerId);

        var cart = new CartEntity
        {
            Id = $"CART-{Guid.NewGuid():N}",
            CustomerID = customerId,
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
            Id = $"CAT-{Guid.NewGuid():N}",
            Name = $"Category_{Guid.NewGuid().ToString("N")[..8]}"
        };
        db.Categories.Add(category);

        var product = new ProductEntity
        {
            Id = $"PROD-{Guid.NewGuid():N}",
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

    private static async Task CleanupAddressesAsync(AppDbContext db, string userId)
    {
        var addresses = db.Addresses.Where(a => a.UserID == userId);
        db.Addresses.RemoveRange(addresses);
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
