using System;

namespace Backend_SEP490.DTOs.Response;

public class ReportStatusResponse
{
    public string ReportId { get; set; } = default!;
    public string TargetType { get; set; } = default!;
    public string TargetId { get; set; } = default!;
    public string? TargetName { get; set; }
    public string Status { get; set; } = default!;
    public string? AppealStatus { get; set; }
    public string? AppealReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUpdatedAt { get; set; }
}
