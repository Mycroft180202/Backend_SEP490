using System.Text.Json.Serialization;

namespace Backend_SEP490.DTOs.External.Ghn;

public class GhnCreateOrderResponse
{
    [JsonPropertyName("code")]
    public int Code { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("data")]
    public GhnCreateOrderData? Data { get; set; }
}

public class GhnCreateOrderData
{
    [JsonPropertyName("order_code")]
    public string? OrderCode { get; set; }

    [JsonPropertyName("expected_delivery_time")]
    public DateTime? ExpectedDeliveryTime { get; set; }

    [JsonPropertyName("total_fee")]
    public int? TotalFee { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }
}
