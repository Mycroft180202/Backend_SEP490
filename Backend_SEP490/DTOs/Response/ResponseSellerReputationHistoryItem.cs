namespace Backend_SEP490.DTOs.Response;

public class ResponseSellerReputationHistoryItem
{
    public string Id { get; set; }
    public int Change { get; set; }
    public int ScoreAfter { get; set; }
    public string? Reason { get; set; }
    public string? OrderNumber { get; set; }
    public DateTime CreatedAt { get; set; }
}
