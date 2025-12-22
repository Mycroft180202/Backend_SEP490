using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface ISellerReputationRepository : IGenericRepository<SellerReputation>
{
    Task<SellerReputation?> GetBySellerIdAsync(string sellerId);
    Task AddHistoryAsync(SellerReputationHistory history);
    Task<List<SellerReputationHistory>> GetHistoryAsync(string sellerId, int pageIndex, int pageSize);
    Task<int> CountHistoryAsync(string sellerId);
    Task<List<SellerReputation>> GetResetCandidatesAsync(DateTime resetBeforeUtc);
}
