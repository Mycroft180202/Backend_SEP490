using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services
{
    public interface ICartService
    {
        public Task<ResponseDTOCart> GetCartByUserIdAsync(string userId);
        public Task<bool> AddCartItemAsync(string userId, RequestAddCartItem request);
        public Task<bool> UpdateCartItemAsync(string cartItemId,int quantity);
        public Task<bool> DeleteCartItemAsync(string cartItemId);
    }
}
