using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.Models;

public class ProductImage
{
    [Key]
    public string Id { get; set; }
    public string ProductId { get; set; }
    public string? URL { get; set; }
    public int? Position { get; set; }

    public Product Product { get; set; }
}
