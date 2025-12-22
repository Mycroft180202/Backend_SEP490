using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class SellerReputationHistory
{
    [Key]
    public string Id { get; set; }
    public string SellerId { get; set; }
    public int Change { get; set; }
    public int ScoreAfter { get; set; }
    public string? Reason { get; set; }
    public string? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public SellerReputation Reputation { get; set; }
}
