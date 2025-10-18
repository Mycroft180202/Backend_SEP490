using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface ICartItemRepositories
    {
        public Task<IEnumerable<CartItem>> GetAllCartitemByCartIdAsync(string cartId);
        public Task<CartItem> GetCartItemByIdAsync(string cartItemId);
        public Task<bool> AddCartItemAsync(CartItem cartItem);
        public Task<bool> UpdateCartItemAsync(CartItem cartItem);
        public Task<bool> DeleteCartItemAsync(CartItem cartItem);
    }
}
