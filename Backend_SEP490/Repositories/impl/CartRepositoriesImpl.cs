using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl
{
    public class CartRepositoriesImpl : GenericRepositoryImpl<Cart>, ICartRepositories
    {
        public CartRepositoriesImpl(AppDbContext context) : base(context)
        {
        }

        public async Task<Cart> GetAllCartItemsAsync(string userId)
        {
            var cart = await _context.Carts.Include(c => c.Customer).Include(c => c.CartItems)
                        .ThenInclude(ci => ci.Product).Where(c => c.CustomerID == userId).FirstOrDefaultAsync();
            return cart;
        }
    }
}
