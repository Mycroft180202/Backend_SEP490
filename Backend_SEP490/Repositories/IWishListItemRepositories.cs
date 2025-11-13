using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IWishListItemRepositories
    {
        public Task<IEnumerable<WishListItem>> GetAllWishListItemByUserIdAsync(string userId);
        public Task<WishListItem> GetWishListItemByIdAsync(string wishListItemId);
        public Task<string> AddWishListItemToCartAsync(WishListItem wishListItem, CartItem cartItem);
        public Task<string> CreateWishListItemAsync(WishListItem wishListItem);
        public Task<string> DeleteWishListItemAsync(WishListItem wishListItem);
    }
}
