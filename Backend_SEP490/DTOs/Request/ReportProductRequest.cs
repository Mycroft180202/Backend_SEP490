using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class ReportProductRequest
{
    [Required]
    public string TargetProductId { get; set; } = default!;

    [Required]
    [StringLength(500)]
    public string Reason { get; set; } = default!;
}
