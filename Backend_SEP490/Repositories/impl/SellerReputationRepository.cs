using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class SellerReputationRepository : GenericRepositoryImpl<SellerReputation>, ISellerReputationRepository
{
    public SellerReputationRepository(AppDbContext context) : base(context)
    {
    }

    public Task<SellerReputation?> GetBySellerIdAsync(string sellerId)
    {
        if (string.IsNullOrWhiteSpace(sellerId))
        {
            return Task.FromResult<SellerReputation?>(null);
        }

        var normalized = sellerId.Trim();
        return _context.SellerReputations
            .Include(r => r.Histories)
            .FirstOrDefaultAsync(r => r.SellerId == normalized);
    }

    public async Task AddHistoryAsync(SellerReputationHistory history)
    {
        await _context.SellerReputationHistories.AddAsync(history);
    }

    public async Task<List<SellerReputationHistory>> GetHistoryAsync(string sellerId, int pageIndex, int pageSize)
    {
        if (string.IsNullOrWhiteSpace(sellerId))
        {
            return new List<SellerReputationHistory>();
        }

        pageIndex = pageIndex < 1 ? 1 : pageIndex;
        pageSize = pageSize < 1 ? 10 : pageSize;

        var normalized = sellerId.Trim();
        return await _context.SellerReputationHistories
            .Where(h => h.SellerId == normalized)
            .OrderByDescending(h => h.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public Task<int> CountHistoryAsync(string sellerId)
    {
        if (string.IsNullOrWhiteSpace(sellerId))
        {
            return Task.FromResult(0);
        }

        var normalized = sellerId.Trim();
        return _context.SellerReputationHistories.CountAsync(h => h.SellerId == normalized);
    }

    public async Task<List<SellerReputation>> GetResetCandidatesAsync(DateTime resetBeforeUtc)
    {
        return await _context.SellerReputations
            .Where(r => r.LockedAt == null &&
                        (r.LastResetAt == null || r.LastResetAt < resetBeforeUtc))
            .ToListAsync();
    }
}
