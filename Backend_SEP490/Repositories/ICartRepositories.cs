using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface ICartRepositories
    {
        public Task<Cart> GetCartByUserIdAsync(string userId);
        public Task<bool> AddCartAsync(Cart cart);
    }
}
