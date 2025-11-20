using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;
public class Order
{
    [Key]
    public string Id { get; set; }
    public string OrderNumber { get; set; }
    public string CustomerId { get; set; }
    public string Status { get; set; }
    [Required]
    [StringLength(20)]
    public string PaymentType { get; set; } = "COD";
    public decimal TotalAmount { get; set; }
    public string ShipingAddressId { get; set; }
    public DateTime CreateAt { get; set; }
    [JsonIgnore]
    public User Customer { get; set; }
    public ICollection<OrderItem>? OrderItems { get; set; }
    public ICollection<Payment>? Payments { get; set; }
    public ICollection<Shipment>? Shipments { get; set; }
}
