using Backend_SEP490.Models;

namespace Backend_SEP490.DTOs.Response;

public class RequestDTOProduct
{
    public string Name { get; set; }
    public string? ShortDescription { get; set; }
    public string? LongDescription { get; set; }
    public decimal Price { get; set; }
    public string Category { get; set; }
    
    public string ArtisanId { get; set; }
    
    public int Stock { get; set; }
    
    public List<IFormFile> images { get; set; } = new();
}