using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class UpdatePaymentStatusRequest
{
    [Required]
    public string PaymentId { get; set; } = default!;

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = default!;
}
