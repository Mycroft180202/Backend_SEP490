using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace Backend_SEP490.Repositories.impl
{
    public class WishListItemRepositoriesImpl : GenericRepositoryImpl<WishListItem>, IWishListItemRepositories
    {
        public WishListItemRepositoriesImpl(AppDbContext context) : base(context)
        {
        }

        public async Task<string> AddWishListItemToCartAsync(WishListItem wishListItem, CartItem cartItem)
        {
            try
            {
                _context.CartItems.Add(cartItem);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return "Add wishlist item to cart failed!";
            }
            try
            {
                _context.WishListItems.Remove(wishListItem);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return "Remove wish list item failed";
            }
            return "Add wishlist item to cart successfully!";
        }

        public async Task<string> CreateWishListItemAsync(WishListItem wishListItem)
        {
            try
            {
                _context.WishListItems.Add(wishListItem);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return "Create wishlist item failed!";
            }
            return "Create wishlist item successfully!";
        }

        public async Task<string> DeleteWishListItemAsync(WishListItem wishListItem)
        {
            try
            {
                _context.WishListItems.Remove(wishListItem);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return "Delete wishlist item failed!";
            }
            return "Delete wishlist item successfully!";
        }

        public async Task<IEnumerable<WishListItem>> GetAllWishListItemByUserIdAsync(string userId, int pageIndex, int pageSize)
        {
            return  await _context.WishListItems.Where(w => w.UserID.EndsWith(userId)).OrderByDescending( w=> w.AddAt)
                .Skip((pageIndex - 1) * pageSize).Take(pageSize).ToListAsync();
            
        }

        public async Task<IEnumerable<WishListItem>> GetAllWishListItemByUserIdAsync(string userId)
        {
            return await _context.WishListItems.Where(w => w.UserID.EndsWith(userId)).ToListAsync();
        }

        public async Task<WishListItem> GetWishListItemByIdAsync(string wishListItemId)
        {
            return await _context.WishListItems.Where(w => w.Id.Equals(wishListItemId)).FirstOrDefaultAsync();
        }
    }
}
