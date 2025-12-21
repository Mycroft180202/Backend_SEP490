using System.Collections.Generic;

namespace Backend_SEP490.DTOs.Response;

public sealed record CreateMultiShopOrderResult
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public decimal DiscountTotal { get; init; }
    public string? VoucherCode { get; init; }
    public List<CreateOrderResult> Orders { get; init; } = new();

    public static CreateMultiShopOrderResult Failure(string message) => new()
    {
        Success = false,
        Message = message
    };

    public static CreateMultiShopOrderResult Succeeded(
        List<CreateOrderResult> orders,
        decimal discountTotal,
        string? voucherCode) => new()
    {
        Success = true,
        Message = "Orders created successfully.",
        Orders = orders ?? new List<CreateOrderResult>(),
        DiscountTotal = discountTotal,
        VoucherCode = voucherCode
    };
}

