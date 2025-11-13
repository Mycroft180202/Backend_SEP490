using System.Linq;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl
{
    public class ShipmentRepositoriesImpl : GenericRepositoryImpl<Shipment>, IShipmentRepositories
    {
        public ShipmentRepositoriesImpl(AppDbContext context) : base(context)
        {
        }

        public async Task<List<Shipment>> GetByOrderIdAsync(string orderId)
        {
            return await _context.Shipments
                .Where(s => s.OrderID == orderId)
                .ToListAsync();
        }

        public async Task<Shipment?> GetByTrackingNumberAsync(string trackingNumber)
        {
            return await _context.Shipments
                .FirstOrDefaultAsync(s => s.TrackingNumber == trackingNumber);
        }
    }
}
