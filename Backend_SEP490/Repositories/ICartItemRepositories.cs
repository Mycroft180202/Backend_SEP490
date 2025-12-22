using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface ICartItemRepositories
    {
        public Task<IEnumerable<CartItem>> GetAllCartitemByCartIdAsync(string cartId);
        public Task<CartItem> GetCartItemByIdAsync(string cartItemId);
        public Task<IReadOnlyList<CartItem>> GetCartItemsByProductIdWithCartAsync(string productId);
        public Task<string> AddCartItemAsync(CartItem cartItem);
        public Task<string> UpdateCartItemAsync(CartItem cartItem, int quantity);
        public Task<string> DeleteCartItemAsync(CartItem cartItem);
    }
}
