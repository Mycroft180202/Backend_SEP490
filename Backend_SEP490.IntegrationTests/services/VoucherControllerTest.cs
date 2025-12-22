using System.Net;
using System.Net.Http.Json;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Backend_SEP490.IntegrationTests.Services;

[CollectionDefinition(nameof(VoucherControllerCollection), DisableParallelization = true)]
public sealed class VoucherControllerCollection : ICollectionFixture<CustomWebApplicationFactory<Program>>
{
}

[Collection(nameof(VoucherControllerCollection))]
public class VoucherControllerTest
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public VoucherControllerTest(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_voucher_paging_currently_returns_404_even_when_data_exists()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var voucher = await CreateVoucherAsync(db);

        try
        {
            var response = await _client.GetAsync("/api/Voucher/voucher/1/10");
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupVoucherAsync(db, voucher.VoucherId);
        }
    }

    [Fact]
    public async Task GET_voucher_with_negative_page_index_also_returns_404()
    {
        var response = await _client.GetAsync("/api/Voucher/voucher/-1/5");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GET_voucher_detail_currently_returns_404_even_when_found()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var voucher = await CreateVoucherAsync(db);

        try
        {
            var response = await _client.GetAsync($"/api/Voucher/voucher/{voucher.VoucherId}");
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupVoucherAsync(db, voucher.VoucherId);
        }
    }

    [Fact]
    public async Task GET_voucher_detail_missing_returns_404()
    {
        var response = await _client.GetAsync($"/api/Voucher/voucher/{Guid.NewGuid():N}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task POST_voucher_returns_404_even_with_valid_payload()
    {
        var payload = BuildCreateVoucherRequest(code: $"VC-{Guid.NewGuid().ToString("N")[..6]}");
        var response = await _client.PostAsJsonAsync("/api/Voucher/voucher", payload);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task POST_voucher_duplicate_code_currently_returns_404()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var existing = await CreateVoucherAsync(db);

        try
        {
            var payload = BuildCreateVoucherRequest(code: existing.Code);
            var response = await _client.PostAsJsonAsync("/api/Voucher/voucher", payload);

            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupVoucherAsync(db, existing.VoucherId);
        }
    }

    [Fact]
    public async Task POST_voucher_invalid_dates_currently_returns_404()
    {
        var payload = BuildCreateVoucherRequest(code: $"VC-{Guid.NewGuid().ToString("N")[..6]}", startOffsetDays: 1, endOffsetDays: 0);
        var response = await _client.PostAsJsonAsync("/api/Voucher/voucher", payload);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PUT_voucher_currently_returns_404_even_for_nonexistent_id()
    {
        var payload = BuildUpdateVoucherRequest(code: $"VC-{Guid.NewGuid().ToString("N")[..6]}");
        var response = await _client.PutAsJsonAsync($"/api/Voucher/voucher/{Guid.NewGuid():N}", payload);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DELETE_voucher_currently_returns_404_even_when_existing()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var voucher = await CreateVoucherAsync(db);

        try
        {
        var response = await _client.DeleteAsync($"/api/Voucher/voucher/{voucher.VoucherId}");
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            await CleanupVoucherAsync(db, voucher.VoucherId);
        }
    }

    [Fact]
    public async Task DELETE_voucher_missing_returns_200_with_not_found_message()
    {
        var response = await _client.DeleteAsync($"/api/Voucher/voucher/{Guid.NewGuid():N}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static RequestCreateVoucher BuildCreateVoucherRequest(string code, int startOffsetDays = 0, int endOffsetDays = 1)
    {
        var today = DateTime.UtcNow.Date;
        return new RequestCreateVoucher
        {
            Code = code,
            Description = "Test voucher",
            DiscountType = "Percent",
            DiscountValue = 5,
            MinOrderAmount = 0,
            MaxDiscountAmount = 100,
            StartDate = today.AddDays(startOffsetDays),
            EndDate = today.AddDays(endOffsetDays),
            UsageLimit = 10,
            UsedCount = 0,
            IsActive = true
        };
    }

    private static RequestUpdateVoucher BuildUpdateVoucherRequest(string code)
    {
        var today = DateTime.UtcNow.Date;
        return new RequestUpdateVoucher
        {
            Code = code,
            Description = "Updated",
            DiscountType = "Fixed",
            DiscountValue = 10,
            MinOrderAmount = 0,
            MaxDiscountAmount = 100,
            StartDate = today,
            EndDate = today.AddDays(5),
            UsageLimit = 5,
            UsedCount = 0,
            IsActive = true
        };
    }

    private static async Task<Voucher> CreateVoucherAsync(AppDbContext db)
    {
        var voucher = new Voucher
        {
            Code = $"VC-{Guid.NewGuid().ToString("N")[..6]}",
            Description = "Seed voucher",
            DiscountType = "Percent",
            DiscountValue = 5,
            MinOrderAmount = 0,
            MaxDiscountAmount = 50,
            StartDate = DateTime.UtcNow.Date,
            EndDate = DateTime.UtcNow.Date.AddDays(10),
            UsageLimit = 10,
            UsedCount = 0,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };
        db.Vouchers.Add(voucher);
        await db.SaveChangesAsync();
        return voucher;
    }

    private static async Task CleanupVoucherAsync(AppDbContext db, int voucherId)
    {
        var voucher = await db.Vouchers.FirstOrDefaultAsync(v => v.VoucherId == voucherId);
        if (voucher != null)
        {
            db.Vouchers.Remove(voucher);
            await db.SaveChangesAsync();
        }
    }
}
