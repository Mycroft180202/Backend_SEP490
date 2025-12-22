using System;

namespace Backend_SEP490.DTOs.Response;

public class ReportSummaryResponse
{
    public string ReportId { get; set; } = default!;
    public string TargetType { get; set; } = default!;
    public string TargetId { get; set; } = default!;
    public string? TargetName { get; set; }
    public string ReporterId { get; set; } = default!;
    public string? ReporterName { get; set; }
    public string? TargetUserId { get; set; }
    public string? TargetUserName { get; set; }
    public string Status { get; set; } = default!;
    public string? AppealStatus { get; set; }
    public string? AssignedAdminId { get; set; }
    public string? AssignedAdminName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
