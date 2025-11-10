using AutoMapper;
using Backend_SEP490.Data;
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
        private string GenerateID(string prefix, string userId) => $"{prefix}-{userId}-{DateTime.UtcNow:yyyyMMdd-HHmmss}";
        public async Task<ResponseDTOCart> GetCartByUserIdAsync(string userId, int pageIndex, int pageSize)
        {
            var cart = await _context.Cart.GetCartByUserIdAsync(userId);
            if(cart == null)
            {
                Cart newCart = new Cart
                {
                    Id =  GenerateID("Cart", userId),
                    CustomerID = userId,
                    CreateAt = DateTime.UtcNow
                };
                var status = await _context.Cart.AddCartAsync(newCart);
                if (!status) return null;

                cart = await _context.Cart.GetCartByUserIdAsync(userId);
            }
            int count = cart.CartItems.Count;
            var pagedCartItems = cart.CartItems.Skip((pageIndex - 1) * pageSize).Take(pageSize).ToList();

            // Map từng cart item sang DTO
            var mappedCartItems = _mapper.Map<IEnumerable<ResponseDTOCartItem>>(pagedCartItems);

            var cartItemPagination = new PagedResult<ResponseDTOCartItem>
            {
                Items = mappedCartItems,
                TotalCount = count,
                PageIndex = pageIndex,
                PageSize = pageSize
            };

            // Map phần cart (không bao gồm items)
            var result = _mapper.Map<ResponseDTOCart>(cart);
            result.CartItems = cartItemPagination;

            return result;
        }
        public async Task<string> AddCartItemAsync(string userId, RequestAddCartItem request)
        {
            //Check xem sản phẩm đó có trong giỏ hàng hay chưa
            var cart = await _context.Cart.GetCartByUserIdAsync(userId);
            if (cart == null)
            {
                Cart newCart = new Cart
                {
                    Id = GenerateID("Cart", userId),
                    CustomerID = userId,
                    CreateAt = DateTime.UtcNow
                };
                var status = await _context.Cart.AddCartAsync(newCart);
                if (!status) return null;

                cart = await _context.Cart.GetCartByUserIdAsync(userId);
            }

            var product = await _context.Products.GetProductByIdAsync(request.ProductId);
            var item = cart.CartItems.Where(ci => ci.ProductId.Equals(request.ProductId)).FirstOrDefault();

           //Nếu có thì add 1 vào sản phẩm đó
            if (item != null)
            {
                if (item.Quantity + request.quantity > product.Stock)
                {
                    return "Out of stock!";
                }
                return await _context.CartItem.UpdateCartItemAsync(item, item.Quantity.Value + request.quantity);
            }

            //Nếu chưa có thì tạo mới sản phẩm đó trong CartItem
            var cartItem = new CartItem
            {
                Id = cart.Id + "-" + request.ProductId,
                ProductId = request.ProductId,
                CartId = cart.Id,
                Quantity = request.quantity,
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
