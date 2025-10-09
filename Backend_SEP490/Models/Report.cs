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
    [JsonIgnore]
    public User Reporter { get; set; }
}
