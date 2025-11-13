using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IShipmentRepositories : IGenericRepository<Shipment>
    {
        Task<List<Shipment>> GetByOrderIdAsync(string orderId);
        Task<Shipment?> GetByTrackingNumberAsync(string trackingNumber);
    }
}
