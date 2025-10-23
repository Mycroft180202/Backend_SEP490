using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services
{
    public interface IWishListItemService
    {

        public Task<PagedResult<ResponseDTOWishListItem>> GetAllWishListItemByUserIdAsync(string userId, int pageIndex, int pageSize);
        public Task<bool> AddWishListItemToCartAsync(string userId,string wishListItemId);
        public Task<bool> CreateWishListItemAsync(string userId, string productId);
        public Task<bool> DeleteWishListItemAsync(string wishListItemId);
    }
}
