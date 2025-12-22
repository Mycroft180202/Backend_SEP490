using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class Report
{
    [Key]
    public string Id { get; set; }
    public string ReporterId { get; set; }
    public string TargetType { get; set; }
    public string TargetID { get; set; }
    public string? Reason { get; set; }
    public string ReportStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? TargetUserId { get; set; }
    public string? AssignedAdminId { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? AdminNotes { get; set; }
    public string? AppealReason { get; set; }
    public string? AppealStatus { get; set; }
    public DateTime? AppealedAt { get; set; }
    [JsonIgnore]
    public User Reporter { get; set; }
    [JsonIgnore]
    public User? TargetUser { get; set; }
    [JsonIgnore]
    public User? AssignedAdmin { get; set; }
}
