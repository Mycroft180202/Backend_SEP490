using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface ISellerShippingProfileRepository : IGenericRepository<SellerShippingProfile>
{
    Task<SellerShippingProfile?> GetBySellerIdAsync(string sellerId);
}
