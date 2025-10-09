using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.Models;

public class Cart
{
    [Key]
    public string Id { get; set; }
    public string CustomerID { get; set; }
    public DateTime? CreateAt { get; set; }

    public User Customer { get; set; }
    public ICollection<CartItem>? CartItems { get; set; }
}
