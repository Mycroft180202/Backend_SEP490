using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class CreateVnpayPaymentRequest
{
    [Required]
    public string OrderId { get; set; } = default!;

    public string? BankCode { get; set; }
}
