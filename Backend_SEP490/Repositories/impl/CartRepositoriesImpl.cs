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

        public async Task<bool> AddCartAsync(Cart cart)
        {
            try
            {
                _context.Carts.Add(cart);
                _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return false;
            }
            return true;
        }

        public async Task<Cart> GetCartByUserIdAsync(string userId)
        {
            var cart = await _context.Carts.Include(c => c.Customer).Include(c => c.CartItems)
                        .ThenInclude(ci => ci.Product).ThenInclude(c => c.ProductImages).Where(c => c.CustomerID == userId).FirstOrDefaultAsync();
            return cart;
        }
    }
}
