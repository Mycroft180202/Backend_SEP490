using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class AssignReportRequest
{
    [StringLength(500)]
    public string? Note { get; set; }
}
