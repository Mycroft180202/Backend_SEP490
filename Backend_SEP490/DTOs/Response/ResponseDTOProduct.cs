using Backend_SEP490.Models;

namespace Backend_SEP490.DTOs.Request;

public class ResponseDTOProduct
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string? ShortDescription { get; set; }
    public decimal Price { get; set; }
    public string Category { get; set; }
    public bool IsActive { get; set; }
    public string ArtisanId { get; set; }
    public string DisplayName { get; set; }
    public int Stock { get; set; }
    public string ShopName { get; set; }
    public double Rating { get; set; }
    public string ImageUrl { get; set; }
}