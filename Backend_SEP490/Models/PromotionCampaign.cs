using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class PromotionCampaign
{
    [Key]
    public string Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string UserID { get; set; }
    public bool IsActive { get; set; }
    [JsonIgnore]
    public User User { get; set; }
    public ICollection<PromotionProduct>? PromotionProducts { get; set; }
}
