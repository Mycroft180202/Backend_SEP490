namespace Backend_SEP490.DTOs.Response;

public class ShipmentStatusUpdateDto
{
    public string OrderId { get; set; } = default!;
    public string ShipmentId { get; set; } = default!;
    public string TrackingNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? Note { get; set; }
}
