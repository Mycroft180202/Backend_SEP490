using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class ShipmentHistoryRepository : GenericRepositoryImpl<ShipmentHistory>, IShipmentHistoryRepository
{
    public ShipmentHistoryRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<ShipmentHistory>> GetByShipmentIdAsync(string shipmentId)
    {
        return await _context.ShipmentHistories
            .Where(h => h.ShipmentId == shipmentId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();
    }
}
