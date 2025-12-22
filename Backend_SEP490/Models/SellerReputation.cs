using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class SellerReputation
{
    [Key]
    public string SellerId { get; set; }
    public int Score { get; set; } = 100;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastResetAt { get; set; }
    public DateTime? LockedAt { get; set; }

    [JsonIgnore]
    public User Seller { get; set; }
    public ICollection<SellerReputationHistory>? Histories { get; set; }
}
