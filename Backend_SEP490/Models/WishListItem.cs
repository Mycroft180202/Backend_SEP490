using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class WishListItem
{
    [Key]
    public string Id { get; set; }
    public string UserID { get; set; }
    public string ProductID { get; set; }
    public DateTime AddAt { get; set; }
    [JsonIgnore]
    public User User { get; set; }
    public Product Product { get; set; }
}
