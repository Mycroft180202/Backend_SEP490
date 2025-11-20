using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers
{
    [Microsoft.AspNetCore.Components.Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WishListController : ControllerBase
    {
        private readonly IWishListItemService _wishListItemService;

        public WishListController(IWishListItemService wishListItemService)
        {
            _wishListItemService = wishListItemService;
        }

        [HttpGet("wish-list")]
        public async Task<IActionResult> GetAllWishListItem([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
        {

            var userId = User.GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }
       
            var wishList = await _wishListItemService.GetAllWishListItemByUserIdAsync(userId, pageIndex, pageSize);
            return Ok(wishList);
        }

        [HttpPost("wish-list")]
        public async Task<IActionResult> CreateWishListItem([FromQuery] string productId)
        {
            if (string.IsNullOrWhiteSpace(productId))
            {
                return BadRequest("Product id is required.");
            }

            var userId = User.GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var status = await _wishListItemService.CreateWishListItemAsync(userId, productId);
            return Ok(status);
        }

        [HttpDelete("wish-list")]
        public async Task<IActionResult> DeleteWishListItem([FromQuery] string wishListItemId)
        {
            if (string.IsNullOrWhiteSpace(wishListItemId))
            {
                return BadRequest("Wish list item id is required.");
            }

            var status = await _wishListItemService.DeleteWishListItemAsync(wishListItemId);
            return Ok(status);
        }
    }
}
