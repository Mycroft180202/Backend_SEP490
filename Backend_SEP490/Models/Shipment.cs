using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class Shipment
{
    [Key]
    public string Id { get; set; }
    public string OrderID { get; set; }
    public string Provider { get; set; }
    public string TrackingNumber { get; set; }
    public string ShippingStatus { get; set; }
    public DateTime ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    [JsonIgnore]
    public Order Order { get; set; }
}
