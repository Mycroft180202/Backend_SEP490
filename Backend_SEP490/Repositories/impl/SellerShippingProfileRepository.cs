using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class SellerShippingProfileRepository : GenericRepositoryImpl<SellerShippingProfile>, ISellerShippingProfileRepository
{
    public SellerShippingProfileRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<SellerShippingProfile?> GetBySellerIdAsync(string sellerId)
    {
        return await _context.SellerShippingProfiles
            .FirstOrDefaultAsync(p => p.SellerId == sellerId);
    }
}
