using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.Models;

public class OrderItem
{
    [Key]
    public string Id { get; set; }
    public string OrderID { get; set; }
    public string ProductID { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    public Order Order { get; set; }
    public Product Product { get; set; }
}
