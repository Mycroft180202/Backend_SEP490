using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl
{
    public class WishListItemServiceImpl : GenericServices, IWishListItemService
    {
        public WishListItemServiceImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
        {
        }

        public async Task<bool> AddWishListItemToCartAsync(string userId, string wishListItemId)
        {
            var wishListItem = await _context.WishListItem.GetWishListItemByIdAsync(wishListItemId);

            // thêm sản phẩm vào CartItem
            var cart = await _context.Cart.GetAllCartItemsAsync(userId);
            var product = await _context.Products.GetProductByIdAsync(wishListItem.ProductID);
            var item = cart.CartItems.Where(ci => ci.ProductId.Equals(wishListItem.ProductID)).FirstOrDefault();

            var status = false;
            if (item != null)
            {
                if (item.Quantity + 1 > product.Stock)
                {
                    return false;
                }
                status = await _context.CartItem.UpdateCartItemAsync(item, item.Quantity.Value + 1);
            }


            var cartItem = new CartItem
            {
                Id = cart.Id + "-" + wishListItem.ProductID,
                ProductId = wishListItem.ProductID,
                CartId = cart.Id,
                Quantity = 1,
                PriceAtAdd = product.Price
            };
            status = await _context.CartItem.AddCartItemAsync(cartItem);

            //Xóa sản phẩm khỏi WishList

            status = await _context.WishListItem.DeleteWishListItemAsync(wishListItem);

            return status;
        }

        public async Task<bool> CreateWishListItemAsync(string userId,string productId)
        {
            var wishListItem = new WishListItem
            {
                Id ="WLI-"+ userId +"-"+productId,
                UserID =userId,
                ProductID =productId,
                AddAt = DateTime.UtcNow
            };

            var status = await _context.WishListItem.CreateWishListItemAsync(wishListItem);
            return status;
        }

        public async Task<bool> DeleteWishListItemAsync(string wishListItemId)
        {
            var wishListItem = await _context.WishListItem.GetWishListItemByIdAsync(wishListItemId);
            var status = await _context.WishListItem.DeleteWishListItemAsync(wishListItem);
            return status;
        }

        public async Task<PagedResult<ResponseDTOWishListItem>> GetAllWishListItemByUserIdAsync(string userId, int pageIndex, int pageSize)
        {
            var wishList = await _context.WishListItem.GetAllWishListItemByUserIdAsync(userId, pageIndex, pageSize);
            var totalCount = wishList.Count();
            var DTOWishList = _mapper.Map<IEnumerable<ResponseDTOWishListItem>>(wishList);

            return new PagedResult<ResponseDTOWishListItem>
            {
                Items = DTOWishList,
                TotalCount = totalCount,
                PageIndex = pageIndex,
                PageSize = pageSize
            };
        }
    }
}
