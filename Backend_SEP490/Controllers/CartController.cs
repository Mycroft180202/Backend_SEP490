using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers
{
    [Microsoft.AspNetCore.Components.Route("api/[controller]")]
    [ApiController]
    public class CartController : ControllerBase
    {
        readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        [HttpGet("carts")]
        public async Task<IActionResult> GetAllCartItems([FromQuery] string userId,[FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
        {
            var cart = await _cartService.GetCartByUserIdAsync(userId, pageIndex, pageSize);
            return Ok(cart);
        }

        [HttpPost("carts")]
        public async Task<IActionResult> AddCartItems([FromBody] RequestAddCartItem request, [FromQuery] string userId)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            else
            {   
                var status = await _cartService.AddCartItemAsync(userId, request);
                return Ok(status);    
            }   
            
        }

        [HttpPut("carts")]
        public async Task<IActionResult> UpdateCartItems([FromQuery] string cartItemId, int quantity)
        {
            var status = await _cartService.UpdateCartItemAsync(cartItemId, quantity);
            return Ok(status);
        }
        [HttpDelete("carts")]
        public async Task<IActionResult> DeleteCartItems([FromQuery] string cartItemId)
        {
            var status = await _cartService.DeleteCartItemAsync(cartItemId);
            return Ok(status);
        }
    }
}
