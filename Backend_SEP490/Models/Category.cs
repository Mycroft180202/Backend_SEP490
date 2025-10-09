using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.Models;

public class Category
{
    [Key]
    public string Id { get; set; }
    public string Name { get; set; }

    public ICollection<Product>? Products { get; set; }
}
