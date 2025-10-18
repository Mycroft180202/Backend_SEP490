using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl
{
    public class CartItemRepositoriesImpl : GenericRepositoryImpl<CartItem>, ICartItemRepositories
    {
        public CartItemRepositoriesImpl(AppDbContext context) : base(context)
        {
        }

        public async Task<bool> AddCartItemAsync(CartItem cartItem)
        {
            try
            {
                _context.CartItems.Add(cartItem);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return false;
            }
            return true;
        }
        public async Task<bool> UpdateCartItemAsync(CartItem cartItem, int quantity)
        {
            cartItem.Quantity = quantity;
            try
            {
                _context.CartItems.Update(cartItem);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return false;
            }
            return true;
        }

        public async Task<IEnumerable<CartItem>> GetAllCartitemByCartIdAsync(string cartId)
        {
            return await _context.CartItems.Where(ci => ci.CartId.Equals(cartId)).ToListAsync();
        }

        public async Task<CartItem> GetCartItemByIdAsync(string cartItemId)
        {
            return await _context.CartItems.Where(ci => ci.Id.Equals(cartItemId)).FirstOrDefaultAsync();
        }

        public async Task<bool> DeleteCartItemAsync(CartItem cartItem)
        {
            try
            {
                _context.CartItems.Remove(cartItem);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return false;
            }
            return true;
        }
    }
}
