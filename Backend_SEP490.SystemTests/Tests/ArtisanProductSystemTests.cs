using System.Globalization;
using System.Net.Http.Json;
using Backend_SEP490.SystemTests.Fixtures;
using Backend_SEP490.SystemTests.Support;
using FluentAssertions;

namespace Backend_SEP490.SystemTests.Tests;

[Collection(nameof(SystemTestCollection))]
public class ArtisanProductSystemTests
{
    private readonly SystemTestFixture _fixture;

    public ArtisanProductSystemTests(SystemTestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Artisan_can_create_update_and_delete_product()
    {
        var artisanSession = await _fixture.GetArtisanSessionAsync();
        using var client = _fixture.CreateAuthenticatedClient(artisanSession);

        var productName = $"System Test Product {Guid.NewGuid():N}";
        var createContent = BuildProductForm(
            name: productName,
            description: "System test long description",
            price: 250000m,
            categoryId: _fixture.DefaultCategoryId,
            artisanId: artisanSession.UserId,
            stock: 5);

        var createResponse = await client.PostAsync("/api/Product/products", createContent);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<bool>();
        created.Should().BeTrue();

        var productId = await FindProductIdByNameAsync(client, productName);
        productId.Should().NotBeNullOrWhiteSpace();

        var updatedName = $"{productName}-Updated";
        var updateContent = BuildProductForm(
            name: updatedName,
            description: "Updated from system test",
            price: 275000m,
            categoryId: _fixture.DefaultCategoryId,
            artisanId: artisanSession.UserId,
            stock: 3);

        var updateResponse = await client.PutAsync($"/api/Product/products/{productId}", updateContent);
        updateResponse.EnsureSuccessStatusCode();
        var updateResult = await updateResponse.Content.ReadFromJsonAsync<bool>();
        updateResult.Should().BeTrue();

        var detail = await client.GetFromJsonAsync<ProductDetail>($"/api/Product/products/{productId}", _fixture.SerializerOptions);
        detail.Should().NotBeNull();
        detail!.Name.Should().Be(updatedName);
        detail.Price.Should().Be(275000m);

        var deleteResponse = await client.DeleteAsync($"/api/Product/products/{productId}");
        deleteResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.NoContent);

        var listAfterDelete = await client.GetFromJsonAsync<PagedResult<ProductListItem>>($"/api/Product/products?productName={Uri.EscapeDataString(updatedName)}&pageIndex=1&pageSize=5", _fixture.SerializerOptions);
        listAfterDelete.Should().NotBeNull();
        listAfterDelete!.Items.Should().AllSatisfy(item => item.IsActive.Should().BeFalse());
    }

    private MultipartFormDataContent BuildProductForm(string name, string description, decimal price, string categoryId, string artisanId, int stock)
    {
        var content = new MultipartFormDataContent
        {
            { new StringContent(name), "Name" },
            { new StringContent($"Short-{name}"), "ShortDescription" },
            { new StringContent(description), "LongDescription" },
            { new StringContent(price.ToString(CultureInfo.InvariantCulture)), "Price" },
            { new StringContent(categoryId), "Category" },
            { new StringContent(artisanId), "ArtisanId" },
            { new StringContent(stock.ToString(CultureInfo.InvariantCulture)), "Stock" }
        };

        var image = TestMedia.CreateTinyImage();
        content.Add(image, "Images", "system-test.png");
        return content;
    }

    private async Task<string> FindProductIdByNameAsync(HttpClient client, string name)
    {
        var response = await client.GetFromJsonAsync<PagedResult<ProductListItem>>($"/api/Product/products?productName={Uri.EscapeDataString(name)}&pageIndex=1&pageSize=5", _fixture.SerializerOptions);
        response.Should().NotBeNull();

        var match = response!.Items.FirstOrDefault(p => string.Equals(p.Name, name, StringComparison.OrdinalIgnoreCase));
        match.Should().NotBeNull("newly created product must be returned in listing");
        return match!.Id;
    }

    private sealed record ProductListItem(string Id, string Name, bool IsActive);

    private sealed record ProductDetail(string Id, string Name, decimal Price);

    private sealed record PagedResult<T>(List<T> Items, int TotalCount, int PageIndex, int PageSize);
}
