using System.Globalization;
using System.Net.Http.Json;
using Backend_SEP490.SystemTests.Fixtures;
using Backend_SEP490.SystemTests.Support;
using FluentAssertions;

namespace Backend_SEP490.SystemTests.Tests;

[Collection(nameof(SystemTestCollection))]
public class CustomerCartAndAddressSystemTests
{
    private readonly SystemTestFixture _fixture;

    public CustomerCartAndAddressSystemTests(SystemTestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Customer_can_manage_addresses_and_cart_items()
    {
        var customerSession = await _fixture.GetCustomerSessionAsync();
        using var customerClient = _fixture.CreateAuthenticatedClient(customerSession);

        // Address creation
        var addressPayload = BuildAddressPayload(line1: "123 System Test", phone: "0900000000");
        var createAddressResponse = await customerClient.PostAsJsonAsync("/api/User/users/address", addressPayload, _fixture.SerializerOptions);
        createAddressResponse.EnsureSuccessStatusCode();

        var addresses = await customerClient.GetFromJsonAsync<List<AddressResponse>>("/api/User/users/address", _fixture.SerializerOptions);
        addresses.Should().NotBeNull();
        addresses!.Should().NotBeEmpty();

        var addressId = addresses!.First().Id;
        var updatePayload = BuildAddressPayload(line1: "456 Updated Avenue", phone: "0911111111");
        var updateResponse = await customerClient.PutAsJsonAsync($"/api/User/users/address?addressId={addressId}", updatePayload, _fixture.SerializerOptions);
        updateResponse.EnsureSuccessStatusCode();

        var deleteResponse = await customerClient.DeleteAsync($"/api/User/users/address?addressId={addressId}");
        deleteResponse.EnsureSuccessStatusCode();

        // Cart operations
        var artisanSession = await _fixture.GetArtisanSessionAsync();
        string? productId = null;
        try
        {
            productId = await CreateTransientProductAsync(artisanSession);

            var addPayload = new
            {
                productId,
                priceAtAdd = 199000m,
                quantity = 1
            };

            var addResponse = await customerClient.PostAsJsonAsync("/api/Cart/carts", addPayload, _fixture.SerializerOptions);
            addResponse.EnsureSuccessStatusCode();

            var cart = await customerClient.GetFromJsonAsync<CartResponse>("/api/Cart/carts?pageIndex=1&pageSize=10", _fixture.SerializerOptions);
            cart.Should().NotBeNull();
            cart!.CartItems.Items.Should().ContainSingle(i => i.Product != null && i.Product.Id == productId);

            var item = cart.CartItems.Items.First(i => i.Product!.Id == productId);
            using var updateContent = new StringContent(string.Empty);
            var updateCartResponse = await customerClient.PutAsync($"/api/Cart/carts?cartItemId={item.Id}&quantity=2", updateContent);
            updateCartResponse.EnsureSuccessStatusCode();

            var updatedCart = await customerClient.GetFromJsonAsync<CartResponse>("/api/Cart/carts?pageIndex=1&pageSize=10", _fixture.SerializerOptions);
            updatedCart.Should().NotBeNull();
            updatedCart!.CartItems.Items.First(i => i.Id == item.Id).Quantity.Should().Be(2);

            var deleteCartResponse = await customerClient.DeleteAsync($"/api/Cart/carts?cartItemId={item.Id}");
            deleteCartResponse.EnsureSuccessStatusCode();

            var finalCart = await customerClient.GetFromJsonAsync<CartResponse>("/api/Cart/carts?pageIndex=1&pageSize=10", _fixture.SerializerOptions);
            finalCart.Should().NotBeNull();
            finalCart!.CartItems.Items.Should().BeEmpty();
        }
        finally
        {
            if (!string.IsNullOrWhiteSpace(productId))
            {
                using var artisanClient = _fixture.CreateAuthenticatedClient(artisanSession);
                await artisanClient.DeleteAsync($"/api/Product/products/{productId}");
            }
        }
    }

    private object BuildAddressPayload(string line1, string phone) => new
    {
        line1,
        line2 = "Suite 1",
        city = "Test City",
        posttalCode = "70000",
        country = "Vietnam",
        isDefault = true,
        contactName = "System Tester",
        contactPhone = phone,
        ghnProvinceId = 1,
        ghnDistrictId = 101,
        ghnWardCode = "W1"
    };

    private async Task<string> CreateTransientProductAsync(AccountSession artisanSession)
    {
        using var artisanClient = _fixture.CreateAuthenticatedClient(artisanSession);
        var productName = $"Cart Product {Guid.NewGuid():N}";
        var form = new MultipartFormDataContent
        {
            { new StringContent(productName), "Name" },
            { new StringContent("Short description"), "ShortDescription" },
            { new StringContent("Cart flow long description"), "LongDescription" },
            { new StringContent("199000"), "Price" },
            { new StringContent(_fixture.DefaultCategoryId), "Category" },
            { new StringContent(artisanSession.UserId), "ArtisanId" },
            { new StringContent("10"), "Stock" }
        };
        var image = TestMedia.CreateTinyImage();
        form.Add(image, "Images", "cart.png");

        var response = await artisanClient.PostAsync("/api/Product/products", form);
        response.EnsureSuccessStatusCode();

        var productList = await artisanClient.GetFromJsonAsync<PagedResult<ProductSummary>>($"/api/Product/products?productName={Uri.EscapeDataString(productName)}&pageIndex=1&pageSize=5", _fixture.SerializerOptions);
        productList.Should().NotBeNull();

        var match = productList!.Items.First(p => string.Equals(p.Name, productName, StringComparison.OrdinalIgnoreCase));
        return match.Id;
    }

    private sealed record AddressResponse(string Id, string Line1, string? City, string? ContactName);

    private sealed record CartResponse(CartPage CartItems);

    private sealed record CartPage(List<CartItemSummary> Items, int TotalCount, int PageIndex, int PageSize);

    private sealed record CartItemSummary(string Id, int? Quantity, CartProductSummary? Product);

    private sealed record CartProductSummary(string Id, string Name);

    private sealed record ProductSummary(string Id, string Name);

    private sealed record PagedResult<T>(List<T> Items, int TotalCount, int PageIndex, int PageSize);
}
