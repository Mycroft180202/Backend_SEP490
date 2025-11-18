namespace Backend_SEP490.DTOs.Response;

public class VnpayPaymentResponse
{
    public string PaymentId { get; set; } = default!;
    public string OrderId { get; set; } = default!;
    public string? OrderNumber { get; set; }
    public decimal Amount { get; set; }
    public string PaymentUrl { get; set; } = default!;
    public string QrContent { get; set; } = default!;
    public DateTime ExpiredAt { get; set; }
}
