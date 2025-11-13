namespace Backend_SEP490.DTOs.Response;

public class ResponseDTOShipment
{
    public string TrackingNumber { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string ShippingStatus { get; set; } = string.Empty;
    public DateTime ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
}
