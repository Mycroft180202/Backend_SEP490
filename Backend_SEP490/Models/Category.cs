using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class Category
{
    [Key]
    public string Id { get; set; }
    public string Name { get; set; }
    [JsonIgnore]
    public ICollection<Product>? Products { get; set; }
}
