using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class ShipmentHistory
{
    [Key]
    public string Id { get; set; } = default!;

    public string ShipmentId { get; set; } = default!;

    public string Status { get; set; } = default!;

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    [JsonIgnore]
    public Shipment Shipment { get; set; } = default!;
}
