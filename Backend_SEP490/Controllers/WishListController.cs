using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
        public async Task<IActionResult> GetAllWishListItem([FromQuery] int pageIndex =1, [FromQuery] int pageSize = 10)
        {
            var userId = User.FindFirstValue("userID");
            var wishList = await _wishListItemService.GetAllWishListItemByUserIdAsync(userId,pageIndex,pageSize);
            return Ok(wishList);
        }


        [HttpPost("wish-list")]
        public async Task<IActionResult> CreateWishListItem([FromQuery]string productId)
        {
            var userId = User.FindFirstValue("userID");
            var status = await _wishListItemService.CreateWishListItemAsync(userId, productId);
            return Ok(status);
        }

        [HttpDelete("wish-list")]
        public async Task<IActionResult> DeleteWishListItem([FromQuery]string wishListItemId)
        {
            var status = await _wishListItemService.DeleteWishListItemAsync(wishListItemId);
            return Ok(status);
        }
    }
}
