using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Backend_SEP490.Models;
using Newtonsoft.Json;

public class Product
{
    [Key]
    public string Id { get; set; }
    public string Name { get; set; }
    public string? ShortDescription { get; set; }
    public string? LongDescription { get; set; }
    public decimal Price { get; set; }
    public string Category { get; set; }
    public bool IsActive { get; set; }
    public string ArtisanId { get; set; }
    public DateTime? CreateAt { get; set; }
    public DateTime? UpdateAt { get; set; }
    public int Stock { get; set; }
    public int QuantitySale { get; set; }
    
    public JsonDocument EmbeddingJson { get; set; }
    [JsonIgnore]
    public Category CategoryNav { get; set; }
    public User Artisan { get; set; }

    
    [JsonIgnore]
    public ICollection<ProductCollection> ProductCollections { get; set; } = new List<ProductCollection>();

    public ICollection<ProductImage>? ProductImages { get; set; }
    public ICollection<CartItem>? CartItems { get; set; }
    public ICollection<OrderItem>? OrderItems { get; set; }
    public ICollection<Feedback>? Feedbacks { get; set; }
    public ICollection<WishListItem>? WishListItems { get; set; }
    public ProductShippingProfile? ShippingProfile { get; set; }
}
