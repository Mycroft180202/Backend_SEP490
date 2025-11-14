using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class ProductShippingProfileRepository : GenericRepositoryImpl<ProductShippingProfile>, IProductShippingProfileRepository
{
    public ProductShippingProfileRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<ProductShippingProfile?> GetByProductIdAsync(string productId)
    {
        return await _context.ProductShippingProfiles.FirstOrDefaultAsync(p => p.ProductId == productId);
    }
}
