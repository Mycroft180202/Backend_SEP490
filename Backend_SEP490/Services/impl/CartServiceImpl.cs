using System;
using System.Collections.Generic;
using System.Linq;
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
        private readonly ICommerceRealtimeService _realtimeService;

        public CartServiceImpl(
            IMapper mapper,
            IUnitOfWork unitOfWork,
            ICommerceRealtimeService realtimeService) : base(mapper, unitOfWork)
        {
            _realtimeService = realtimeService;
        }

        private string GenerateID(string prefix, string userId) => $"{prefix}-{userId}-{DateTime.UtcNow:yyyyMMdd-HHmmss}";

        public async Task<ResponseDTOCart> GetCartByUserIdAsync(string userId, int pageIndex, int pageSize)
        {
            var cart = await EnsureCartAsync(userId);
            if (cart == null)
            {
                return null;
            }

            return await BuildCartResponseAsync(cart, pageIndex, pageSize);
        }

        public async Task<string> AddCartItemAsync(string userId, RequestAddCartItem request)
        {
            var cart = await EnsureCartAsync(userId);
            if (cart == null)
            {
                return "Unable to create cart!";
            }

            var product = await _context.Products.GetProductByIdAsync(request.ProductId);
            if (product == null)
            {
                return "Product not found!";
            }

            var item = cart.CartItems?.FirstOrDefault(ci => ci.ProductId == request.ProductId);

            if (item != null)
            {
                if (item.Quantity + request.quantity > product.Stock)
                {
                    return "Out of stock!";
                }

                var updateMessage = await _context.CartItem.UpdateCartItemAsync(item, item.Quantity.Value + request.quantity);
                await TryBroadcastCartAsync(userId, updateMessage);
                return updateMessage;
            }

            var cartItem = new CartItem
            {
                Id = $"{cart.Id}-{request.ProductId}",
                ProductId = request.ProductId,
                CartId = cart.Id,
                Quantity = request.quantity,
                PriceAtAdd = request.PriceAtAdd
            };

            var addMessage = await _context.CartItem.AddCartItemAsync(cartItem);
            await TryBroadcastCartAsync(userId, addMessage);
            return addMessage;
        }

        public async Task<string> UpdateCartItemAsync(string cartItemId, int quatity)
        {
            var cartItem = await _context.CartItem.GetCartItemByIdAsync(cartItemId);
            if (cartItem == null)
            {
                return "CartItem not found!";
            }

            var product = await _context.Products.GetProductByIdAsync(cartItem.ProductId);
            if (product == null)
            {
                return "Product not found!";
            }

            if (quatity > product.Stock)
            {
                return "Out of stock!";
            }

            string message;
            if (quatity == 0)
            {
                message = await _context.CartItem.DeleteCartItemAsync(cartItem);
            }
            else
            {
                message = await _context.CartItem.UpdateCartItemAsync(cartItem, quatity);
            }

            await TryBroadcastCartAsync(cartItem.Cart?.CustomerID, message);
            return message;
        }

        public async Task<string> DeleteCartItemAsync(string cartItemId)
        {
            var cartItem = await _context.CartItem.GetCartItemByIdAsync(cartItemId);
            if (cartItem == null) return "CartItem not found!";
            var status = await _context.CartItem.DeleteCartItemAsync(cartItem);
            await TryBroadcastCartAsync(cartItem.Cart?.CustomerID, status);
            return status;
        }

        private async Task<Cart?> EnsureCartAsync(string userId)
        {
            var cart = await _context.Cart.GetCartByUserIdAsync(userId);
            if (cart != null)
            {
                return cart;
            }

            var newCart = new Cart
            {
                Id = GenerateID("Cart", userId),
                CustomerID = userId,
                CreateAt = DateTime.UtcNow
            };
            var status = await _context.Cart.AddCartAsync(newCart);
            if (!status)
            {
                return null;
            }

            return await _context.Cart.GetCartByUserIdAsync(userId);
        }

        private async Task<ResponseDTOCart> BuildCartResponseAsync(Cart cart, int pageIndex, int pageSize)
        {
            var totalItems = cart.CartItems?.Count ?? 0;
            var pagedCartItems = cart.CartItems?
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToList() ?? new List<CartItem>();

            var mappedCartItems = _mapper.Map<IEnumerable<ResponseDTOCartItem>>(pagedCartItems);

            foreach (var item in mappedCartItems)
            {
                if (item.Product != null)
                {
                    var images = await _context.ProductImages.GetImagesByProductIdAsync(item.Product.Id);
                    var primaryImage = images?.FirstOrDefault();
                    item.Product.ImageUrl = primaryImage?.URL;
                }
            }

            var cartItemPagination = new PagedResult<ResponseDTOCartItem>
            {
                Items = mappedCartItems,
                TotalCount = totalItems,
                PageIndex = pageIndex,
                PageSize = pageSize
            };

            var result = _mapper.Map<ResponseDTOCart>(cart);
            result.CartItems = cartItemPagination;

            return result;
        }

        private async Task TryBroadcastCartAsync(string? userId, string statusMessage)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(statusMessage) ||
                (!statusMessage.Contains("success", StringComparison.OrdinalIgnoreCase) &&
                 !statusMessage.Contains("succes", StringComparison.OrdinalIgnoreCase)))
            {
                return;
            }

            var cart = await _context.Cart.GetCartByUserIdAsync(userId);
            if (cart == null)
            {
                return;
            }

            var dto = await BuildCartResponseAsync(cart, 1, Math.Max(cart.CartItems?.Count ?? 0, 10));
            if (dto != null)
            {
                dto.CartItems!.PageSize = dto.CartItems.TotalCount;
                await _realtimeService.SendCartSnapshotAsync(userId, dto);
            }
        }
    }
}
