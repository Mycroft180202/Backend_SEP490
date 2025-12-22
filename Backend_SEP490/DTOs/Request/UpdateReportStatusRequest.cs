using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class UpdateReportStatusRequest
{
    [Required]
    [StringLength(50)]
    public string NewStatus { get; set; } = default!;

    [StringLength(500)]
    public string? AdminNote { get; set; }
}
