using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IWishListItemRepositories
    {
        public Task<IEnumerable<WishListItem>> GetAllWishListItemByUserIdAsync(string userId, int pageIndex, int pageSize);
        public Task<WishListItem> GetWishListItemByIdAsync(string wishListItemId);
        public Task<bool> AddWishListItemToCartAsync(WishListItem wishListItem, CartItem cartItem);
        public Task<bool> CreateWishListItemAsync(WishListItem wishListItem);
        public Task<bool> DeleteWishListItemAsync(WishListItem wishListItem);
    }
}
