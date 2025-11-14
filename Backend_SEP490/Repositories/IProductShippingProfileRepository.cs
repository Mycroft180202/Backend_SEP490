using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IProductShippingProfileRepository : IGenericRepository<ProductShippingProfile>
{
    Task<ProductShippingProfile?> GetByProductIdAsync(string productId);
}

