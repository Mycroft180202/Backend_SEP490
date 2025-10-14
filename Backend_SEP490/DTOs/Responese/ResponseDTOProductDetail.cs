namespace Backend_SEP490.DTOs.Request;

public class ResponseDTOProductDetail
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string? ShortDescription { get; set; }
    public string? LongDescription { get; set; }
    public decimal Price { get; set; }
    public string Category { get; set; }
    public bool IsActive { get; set; }
    public string ArtisanId { get; set; }
    public string DisplayName { get; set; }
    public DateTime? CreateAt { get; set; }
    public DateTime? UpdateAt { get; set; }
    public int Stock { get; set; }
    public string ShopName { get; set; }
    public double Rating { get; set; }
    public List<string> Images { get; set; }
}