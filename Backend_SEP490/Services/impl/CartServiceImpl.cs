using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl
{
    public class CartServiceImpl : GenericServices, ICartService
    {
        public CartServiceImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
        {
        }

        public async Task<ResponseDTOCart> GetCartByUserIdAsync(string userId)
        {
            var cart = await _context.Cart.GetAllCartItemsAsync(userId);

            return _mapper.Map<ResponseDTOCart>(cart);
        }
        public async Task<bool> AddCartItemAsync(string userId, RequestAddCartItem request)
        {
            var cart = await _context.Cart.GetAllCartItemsAsync(userId);
            var product = await _context.Products.GetProductByIdAsync(request.ProductId);
            var item = cart.CartItems.Where(ci => ci.ProductId.Equals(request.ProductId)).FirstOrDefault();

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
                Id = cart.Id + "-" + request.ProductId,
                ProductId = request.ProductId,
                CartId = cart.Id,
                Quantity = 1,
                PriceAtAdd = request.PriceAtAdd
            };
            status = await _context.CartItem.AddCartItemAsync(cartItem);
            return status;
        }

        public async Task<bool> UpdateCartItemAsync(string cartItemId, int quatity)
        {
            var cartItem = await _context.CartItem.GetCartItemByIdAsync(cartItemId);
            var product = await _context.Products.GetProductByIdAsync(cartItem.ProductId);
            if (quatity > product.Stock)
            {
                return false;
            }
            if(quatity == 0)
            {
                return await _context.CartItem.DeleteCartItemAsync(cartItem);
            } 
                
            if (cartItem == null) return false;
            return await _context.CartItem.UpdateCartItemAsync(cartItem, quatity);
        }
        public async Task<bool> DeleteCartItemAsync(string cartItemId)
        {
            var cartItem = await _context.CartItem.GetCartItemByIdAsync(cartItemId);
            if(cartItem == null) return false;
            var status = await _context.CartItem.DeleteCartItemAsync(cartItem);
            return status;
        }
    }
}
