using Backend_SEP490.Data;

namespace Backend_SEP490.DTOs.Response;

public class ResponseSellerReputationHistory
{
    public int Score { get; set; }
    public DateTime? LastResetAt { get; set; }
    public DateTime? LockedAt { get; set; }
    public PagedResult<ResponseSellerReputationHistoryItem> History { get; set; } = new();
}
