using System.Net;
using System.Net.Http.Json;
using Backend_SEP490.SystemTests.Fixtures;
using FluentAssertions;

namespace Backend_SEP490.SystemTests.Tests;

[Collection(nameof(SystemTestCollection))]
public class AdminVoucherSystemTests
{
    private readonly SystemTestFixture _fixture;

    public AdminVoucherSystemTests(SystemTestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Admin_can_create_update_and_delete_voucher()
    {
        var adminSession = await _fixture.GetAdminSessionAsync();
        using var client = _fixture.CreateAuthenticatedClient(adminSession);

        var voucherCode = $"SYS-{Guid.NewGuid():N}".Substring(0, 16).ToUpperInvariant();
        var createPayload = new
        {
            code = voucherCode,
            description = "System test voucher",
            discountType = "Fixed",
            discountValue = 50000m,
            minOrderAmount = 100000m,
            maxDiscountAmount = (decimal?)null,
            startDate = DateTime.UtcNow,
            endDate = DateTime.UtcNow.AddDays(7),
            usageLimit = 10,
            isActive = true,
            isShared = true,
            singleUse = false,
            ownerUserId = (string?)null,
            source = "system-tests"
        };

        var createResponse = await client.PostAsJsonAsync("/api/Voucher/voucher", createPayload, _fixture.SerializerOptions);
        createResponse.EnsureSuccessStatusCode();
        var createMessage = await createResponse.Content.ReadAsStringAsync();
        createMessage.Should().Contain("success", "voucher creation must succeed");

        var voucherId = await FindVoucherIdByCodeAsync(client, voucherCode);
        voucherId.Should().BeGreaterThan(0);

        var updatePayload = new
        {
            code = voucherCode,
            description = "Updated via system test",
            discountType = "Percent",
            discountValue = 5m,
            minOrderAmount = 150000m,
            maxDiscountAmount = 80000m,
            startDate = DateTime.UtcNow,
            endDate = DateTime.UtcNow.AddDays(10),
            usageLimit = 20,
            usedCount = 0,
            isActive = true,
            isShared = true,
            singleUse = false,
            ownerUserId = (string?)null,
            source = "system-tests"
        };

        var updateResponse = await client.PutAsJsonAsync($"/api/Voucher/voucher/{voucherId}", updatePayload, _fixture.SerializerOptions);
        updateResponse.EnsureSuccessStatusCode();
        var updateMessage = await updateResponse.Content.ReadAsStringAsync();
        updateMessage.Should().Contain("success", "voucher update must succeed");

        var deleteResponse = await client.DeleteAsync($"/api/Voucher/voucher/{voucherId}");
        deleteResponse.EnsureSuccessStatusCode();
        var deleteMessage = await deleteResponse.Content.ReadAsStringAsync();
        deleteMessage.Should().Contain("success", "voucher delete must succeed");

        var getDeletedResponse = await client.GetAsync($"/api/Voucher/voucher/{voucherId}");
        getDeletedResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private async Task<int> FindVoucherIdByCodeAsync(HttpClient client, string code)
    {
        var response = await client.GetFromJsonAsync<PagedResult<VoucherSummary>>("/api/Voucher/voucher?pageIndex=1&pageSize=100", _fixture.SerializerOptions);
        response.Should().NotBeNull();

        var match = response!.Items.FirstOrDefault(v => string.Equals(v.Code, code, StringComparison.OrdinalIgnoreCase));
        match.Should().NotBeNull("the freshly created voucher must be queryable");
        return match!.VoucherId;
    }

    private sealed record VoucherSummary(int VoucherId, string Code);

    private sealed record PagedResult<T>(List<T> Items, int TotalCount, int PageIndex, int PageSize);
}
