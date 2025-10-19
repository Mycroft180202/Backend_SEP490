using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers
{
    [Microsoft.AspNetCore.Components.Route("api/[controller]")]
    [ApiController]
    public class WishListController : ControllerBase
    {
        readonly IWishListItemService _wishListItemService;

        public WishListController(IWishListItemService wishListItemService) 
        {
            _wishListItemService = wishListItemService;
        }
        [HttpGet("wish-list")]
        public async Task<IActionResult> GetAllWishListItem([FromRoute] int pageIndex, [FromRoute] int pageSize)
        {
            var userId = User.FindFirst("userId")?.Value;
            var wishLit = await _wishListItemService.GetAllWishListItemByUserIdAsync(userId,pageIndex,pageSize);
            return Ok(wishLit);
        }

        [HttpGet("wish-list")]
        public async Task<IActionResult> AddAllWishListItemToCart([FromRoute] string wishListItemId)
        {
            var wishLit = await _wishListItemService.AddWishListItemToCartAsync(wishListItemId);
            return Ok(wishLit);
        }

        [HttpPost("wish-list")]
        public async Task<IActionResult> CreateWishListItem([FromRoute]string wishListItemId)
        {
            var userId = User.FindFirst("userId")?.Value;
            var wishLit = await _wishListItemService.CreateWishListItemAsync(userId,wishListItemId);
            return Ok(wishLit);
        }
        [HttpDelete("wish-list")]
        public async Task<IActionResult> DeleteWishListItem(string wishListItemId)
        {
            var wishLit = await _wishListItemService.DeleteWishListItemAsync(wishListItemId);
            return Ok(wishLit);
        }
    }
}
