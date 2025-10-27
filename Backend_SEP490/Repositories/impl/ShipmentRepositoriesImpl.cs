using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories.impl
{
    public class ShipmentRepositoriesImpl : GenericRepositoryImpl<Shipment>, IShipmentRepositories
    {
        public ShipmentRepositoriesImpl(AppDbContext context) : base(context)
        {
        }
    }
}
