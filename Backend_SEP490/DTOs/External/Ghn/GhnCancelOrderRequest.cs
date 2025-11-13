using System.Text.Json.Serialization;

namespace Backend_SEP490.DTOs.External.Ghn;

public class GhnCancelOrderRequest
{
    [JsonPropertyName("order_codes")]
    public List<string>? OrderCodes { get; set; }

    [JsonPropertyName("client_order_codes")]
    public List<string>? ClientOrderCodes { get; set; }

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }
}
