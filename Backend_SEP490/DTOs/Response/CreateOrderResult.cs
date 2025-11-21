namespace Backend_SEP490.DTOs.Response;

public sealed record CreateOrderResult
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public string OrderId { get; init; } = string.Empty;
    public string PaymentMethod { get; init; } = string.Empty;
    public string Status { get; init; } = "PENDING";
    public decimal Subtotal { get; init; }
    public decimal Discount { get; init; }
    public decimal ShippingFee { get; init; }
    public decimal Total { get; init; }
    public string? VoucherCode { get; init; }
    public string? GhnOrderCode { get; init; }
    public DateTime? ExpectedDelivery { get; init; }
    public string? PaymentUrl { get; set; }
    public string? PaymentId { get; set; }

    public static CreateOrderResult Failure(string message) => new()
    {
        Success = false,
        Message = message
    };

    public static CreateOrderResult Succeeded(
        string orderId,
        string paymentMethod,
        decimal subtotal,
        decimal discount,
        decimal shippingFee,
        decimal total,
        string status,
        string? voucherCode = null) => new()
    {
        Success = true,
        Message = $"Order created successfully ({paymentMethod}).",
        OrderId = orderId,
        PaymentMethod = paymentMethod,
        Subtotal = subtotal,
        Discount = discount,
        ShippingFee = shippingFee,
        Total = total,
        Status = status,
        VoucherCode = voucherCode
    };
}
