using System;

namespace Backend_SEP490.DTOs.Response;

public class VnpayCallbackResult
{
    public bool Success { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Message { get; set; }
    public string? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string? PaymentId { get; set; }
    public string? TransactionNo { get; set; }
    public DateTimeOffset IssuedAt { get; set; } = DateTimeOffset.UtcNow;
}
