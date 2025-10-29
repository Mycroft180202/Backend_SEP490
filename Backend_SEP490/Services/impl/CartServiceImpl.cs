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
        public async Task<string> AddCartItemAsync(string userId, RequestAddCartItem request)
        {
            //Check xem sản phẩm đó có trong giỏ hàng hay chưa
            var cart = await _context.Cart.GetAllCartItemsAsync(userId);
            var product = await _context.Products.GetProductByIdAsync(request.ProductId);
            var item = cart.CartItems.Where(ci => ci.ProductId.Equals(request.ProductId)).FirstOrDefault();

           //Nếu có thì add 1 vào sản phẩm đó
            if (item != null)
            {
                if (item.Quantity + 1 > product.Stock)
                {
                    return "Out of stock!";
                }
                return await _context.CartItem.UpdateCartItemAsync(item, item.Quantity.Value + 1);
            }

            //Nếu chưa có thì tạo mới sản phẩm đó trong CartItem
            var cartItem = new CartItem
            {
                Id = cart.Id + "-" + request.ProductId,
                ProductId = request.ProductId,
                CartId = cart.Id,
                Quantity = 1,
                PriceAtAdd = request.PriceAtAdd
            };
            return await _context.CartItem.AddCartItemAsync(cartItem);
        }

        public async Task<string> UpdateCartItemAsync(string cartItemId, int quatity)
        {
            var cartItem = await _context.CartItem.GetCartItemByIdAsync(cartItemId);
            var product = await _context.Products.GetProductByIdAsync(cartItem.ProductId);
            if (quatity > product.Stock)
            {
                return "Out of stock!";
            }
            if(quatity == 0)
            {
                return await _context.CartItem.DeleteCartItemAsync(cartItem);
            } 
                
            if (cartItem == null) return "CartItem not found!";
            return await _context.CartItem.UpdateCartItemAsync(cartItem, quatity);
        }
        public async Task<string> DeleteCartItemAsync(string cartItemId)
        {
            var cartItem = await _context.CartItem.GetCartItemByIdAsync(cartItemId);
            if(cartItem == null) return "CartItem not found!";
            var status = await _context.CartItem.DeleteCartItemAsync(cartItem);
            return status;
        }
    }
}
