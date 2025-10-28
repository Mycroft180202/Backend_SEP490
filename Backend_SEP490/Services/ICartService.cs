using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services
{
    public interface ICartService
    {
        public Task<ResponseDTOCart> GetCartByUserIdAsync(string userId);
        public Task<string> AddCartItemAsync(string userId, RequestAddCartItem request);
        public Task<string> UpdateCartItemAsync(string cartItemId,int quantity);
        public Task<string> DeleteCartItemAsync(string cartItemId);
    }
}
