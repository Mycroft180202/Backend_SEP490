using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl
{
    public class CartItemRepositoriesImpl : GenericRepositoryImpl<CartItem>, ICartItemRepositories
    {
        public CartItemRepositoriesImpl(AppDbContext context) : base(context)
        {
        }

        public async Task<string> AddCartItemAsync(CartItem cartItem)
        {
            try
            {
                _context.CartItems.Add(cartItem);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return "Add cart item failed!";
            }
            return "Add cart item succesfully!";
        }
        public async Task<string> UpdateCartItemAsync(CartItem cartItem, int quantity)
        {
            cartItem.Quantity = quantity;
            try
            {
                _context.CartItems.Update(cartItem);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return "Update cart item failed!";
            }
            return "Update cart item succesfully!";
        }

        public async Task<IEnumerable<CartItem>> GetAllCartitemByCartIdAsync(string cartId)
        {
            return await _context.CartItems.Where(ci => ci.CartId.Equals(cartId)).ToListAsync();
        }

        public async Task<CartItem> GetCartItemByIdAsync(string cartItemId)
        {
            return await _context.CartItems.Where(ci => ci.Id.Equals(cartItemId)).FirstOrDefaultAsync();
        }

        public async Task<string> DeleteCartItemAsync(CartItem cartItem)
        {
            try
            {
                _context.CartItems.Remove(cartItem);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return "Delete cart item failed!";
            }
            return "Delete cart item succesfully!";
        }
    }
}
