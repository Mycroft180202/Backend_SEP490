using System;

namespace Backend_SEP490.DTOs.Response;

public class ReportDetailResponse
{
    public string ReportId { get; set; } = default!;
    public string TargetType { get; set; } = default!;
    public string TargetId { get; set; } = default!;
    public string? TargetName { get; set; }
    public string ReporterId { get; set; } = default!;
    public string? ReporterName { get; set; }
    public string? ReporterEmail { get; set; }
    public string? TargetUserId { get; set; }
    public string? TargetUserName { get; set; }
    public string? TargetUserEmail { get; set; }
    public string? AssignedAdminId { get; set; }
    public string? AssignedAdminName { get; set; }
    public string? Reason { get; set; }
    public string Status { get; set; } = default!;
    public string? AdminNotes { get; set; }
    public string? AppealReason { get; set; }
    public string? AppealStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? AppealedAt { get; set; }
}
