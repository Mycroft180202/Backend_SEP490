using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.Models;

public class PromotionProduct
{
    [Key]
    public string Id { get; set; }
    public string CampainId { get; set; }
    public string ProductId { get; set; }
    public string HighlightText { get; set; }
    public int DisplayOrder { get; set; }

    public PromotionCampaign Campain { get; set; }
    public Product Product { get; set; }
}
