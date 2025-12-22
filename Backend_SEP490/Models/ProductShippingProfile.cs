using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class ProductShippingProfile
{
    [Key]
    public string Id { get; set; } = default!;
    public string ProductId { get; set; } = default!;
    public int? WeightGram { get; set; }
    public int? LengthCm { get; set; }
    public int? WidthCm { get; set; }
    public int? HeightCm { get; set; }
    public bool AllowCod { get; set; } = true;
    public string? Notes { get; set; }
    [JsonIgnore]
    public Product Product { get; set; } = default!;
}
