using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services;

public interface ISellerReputationService
{
    Task<SellerReputation> EnsureAsync(string sellerId, CancellationToken cancellationToken);
    Task<ReputationPenaltyResult> ApplyMissedConfirmationPenaltyAsync(string sellerId, Order order, CancellationToken cancellationToken);
    Task<ResponseSellerReputationHistory> GetHistoryAsync(string sellerId, int pageIndex, int pageSize, CancellationToken cancellationToken);
}

public record ReputationPenaltyResult(int NewScore, bool LockedAccount);
