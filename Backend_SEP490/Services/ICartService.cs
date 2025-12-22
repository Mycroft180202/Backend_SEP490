using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Services
{
    public interface ICartService
    {
        public Task<ResponseDTOCart> GetCartByUserIdAsync(string userId, int pageIndex, int pageSize);
        public Task<string> AddCartItemAsync(string userId, RequestAddCartItem request);
        public Task<string> UpdateCartItemAsync(string cartItemId,int quantity);
        public Task<string> DeleteCartItemAsync(string cartItemId);
    }
}
