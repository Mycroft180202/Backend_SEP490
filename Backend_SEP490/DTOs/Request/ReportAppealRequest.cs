using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class ReportAppealRequest
{
    [Required]
    [StringLength(1000, MinimumLength = 10)]
    public string Message { get; set; } = default!;
}
