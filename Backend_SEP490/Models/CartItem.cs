using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class CartItem
{
    [Key]
    public string Id { get; set; }
    public string? CartId { get; set; }
    public string? ProductId { get; set; }
    public int? Quantity { get; set; }
    public decimal? PriceAtAdd { get; set; }
    [JsonIgnore]
    public Cart? Cart { get; set; }
    public Product? Product { get; set; }
}
