using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Microsoft.Extensions.Logging;

namespace Backend_SEP490.Services.impl;

public class SellerReputationService : GenericServices, ISellerReputationService
{
    private const int MaxScore = 100;
    private const int PenaltyPoints = 5;
    private readonly ILogger<SellerReputationService> _logger;

    public SellerReputationService(
        IMapper mapper,
        IUnitOfWork unitOfWork,
        ILogger<SellerReputationService> logger) : base(mapper, unitOfWork)
    {
        _logger = logger;
    }

    public async Task<SellerReputation> EnsureAsync(string sellerId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(sellerId))
        {
            throw new ArgumentException("Seller id is required.", nameof(sellerId));
        }

        var normalized = sellerId.Trim();
        var reputation = await _context.SellerReputations.GetBySellerIdAsync(normalized);
        if (reputation == null)
        {
            reputation = new SellerReputation
            {
                SellerId = normalized,
                Score = MaxScore,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                LastResetAt = GetCurrentYearStart()
            };

            await _context.SellerReputations.AddAsync(reputation);
            await _context.SaveChangesAsync();
        }
        else
        {
            await ResetIfNeededAsync(reputation, cancellationToken);
        }

        return reputation;
    }

    public async Task<ReputationPenaltyResult> ApplyMissedConfirmationPenaltyAsync(string sellerId, Order order, CancellationToken cancellationToken)
    {
        var reputation = await EnsureAsync(sellerId, cancellationToken);
        if (cancellationToken.IsCancellationRequested)
        {
            return new ReputationPenaltyResult(reputation.Score, reputation.LockedAt != null);
        }

        if (reputation.LockedAt != null)
        {
            return new ReputationPenaltyResult(reputation.Score, true);
        }

        var now = DateTime.UtcNow;
        var newScore = Math.Max(0, reputation.Score - PenaltyPoints);
        reputation.Score = newScore;
        reputation.UpdatedAt = now;

        var history = new SellerReputationHistory
        {
            Id = $"SRH-{Guid.NewGuid():N}",
            SellerId = reputation.SellerId,
            Change = -PenaltyPoints,
            ScoreAfter = newScore,
            Reason = "Seller did not confirm order within 24h.",
            OrderId = order?.Id,
            OrderNumber = order?.OrderNumber,
            CreatedAt = now
        };

        await _context.SellerReputations.AddHistoryAsync(history);

        var locked = false;
        if (newScore <= 0 && reputation.LockedAt == null)
        {
            reputation.LockedAt = now;
            locked = true;
            await LockSellerAccountAsync(reputation.SellerId);
        }

        await _context.SaveChangesAsync();

        return new ReputationPenaltyResult(reputation.Score, locked || reputation.LockedAt != null);
    }

    public async Task<ResponseSellerReputationHistory> GetHistoryAsync(string sellerId, int pageIndex, int pageSize, CancellationToken cancellationToken)
    {
        var reputation = await EnsureAsync(sellerId, cancellationToken);

        var histories = await _context.SellerReputations.GetHistoryAsync(sellerId, pageIndex, pageSize);
        var total = await _context.SellerReputations.CountHistoryAsync(sellerId);

        return new ResponseSellerReputationHistory
        {
            Score = reputation.Score,
            LastResetAt = reputation.LastResetAt,
            LockedAt = reputation.LockedAt,
            History = new PagedResult<ResponseSellerReputationHistoryItem>
            {
                Items = _mapper.Map<IEnumerable<ResponseSellerReputationHistoryItem>>(histories),
                TotalCount = total,
                PageIndex = pageIndex < 1 ? 1 : pageIndex,
                PageSize = pageSize < 1 ? 10 : pageSize
            }
        };
    }

    private async Task ResetIfNeededAsync(SellerReputation reputation, CancellationToken cancellationToken)
    {
        if (reputation.LockedAt != null)
        {
            return;
        }

        var yearStart = GetCurrentYearStart();
        if (reputation.LastResetAt.HasValue && reputation.LastResetAt.Value.Year >= yearStart.Year)
        {
            return;
        }

        reputation.Score = MaxScore;
        reputation.LastResetAt = yearStart;
        reputation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    private async Task LockSellerAccountAsync(string sellerId)
    {
        try
        {
            var user = await _context.Users.GetByIdAsync(sellerId);
            if (user != null && user.IsActive)
            {
                user.IsActive = false;
            }

            var products = await _context.Products.GetProductsByArtisanIdAsync(sellerId);
            foreach (var product in products)
            {
                product.IsActive = false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to lock seller {SellerId} while applying reputation penalty.", sellerId);
        }
    }

    private static DateTime GetCurrentYearStart()
    {
        var now = DateTime.UtcNow;
        return new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
    }
}
