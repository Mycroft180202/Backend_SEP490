using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IShipmentHistoryRepository : IGenericRepository<ShipmentHistory>
{
    Task<List<ShipmentHistory>> GetByShipmentIdAsync(string shipmentId);
}
