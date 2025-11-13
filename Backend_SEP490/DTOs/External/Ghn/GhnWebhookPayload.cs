using System.Text.Json.Serialization;

namespace Backend_SEP490.DTOs.External.Ghn;

public class GhnWebhookPayload
{
    [JsonPropertyName("OrderCode")]
    public string? OrderCode { get; set; }

    [JsonPropertyName("ClientOrderCode")]
    public string? ClientOrderCode { get; set; }

    [JsonPropertyName("CurrentStatus")]
    public string? CurrentStatus { get; set; }

    [JsonPropertyName("ReasonCode")]
    public string? ReasonCode { get; set; }

    [JsonPropertyName("Reason")]
    public string? Reason { get; set; }

    [JsonPropertyName("UpdatedDate")]
    public DateTime? UpdatedDate { get; set; }

    [JsonPropertyName("CodAmount")]
    public decimal? CodAmount { get; set; }

    [JsonPropertyName("CodCollected")]
    public bool? CodCollected { get; set; }
}
