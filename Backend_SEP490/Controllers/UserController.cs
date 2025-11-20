using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers
{
    [Microsoft.AspNetCore.Components.Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserServices _userServices;
        private readonly IAddressService _addressServices;

        public UserController(IUserServices userServices, IAddressService addressServices)
        {
            _userServices = userServices;
            _addressServices = addressServices;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
        {
            var users = await _userServices.GetAllUsersAsync(pageIndex, pageSize);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUsersById([FromRoute] string userId)
        {
            var users = await _userServices.GetUserByIDAsync(id);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUsers([FromRoute] string id, [FromBody] RequestAdminUpdateUser request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var users = await _userServices.UpdateUserAsync(id, request);

            return Ok(users);
        }

       
        [HttpPut("users")]
        public async Task<IActionResult> UpdateUsers([FromQuery] string userId, [FromBody] RequestAdminUpdateUser request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var users = await _userServices.UpdateUserAsync(userId, request);
            
            return Ok(users);
        }
 

        [Authorize]
        [HttpPut("users/me")]
        public async Task<IActionResult> UpdateUsersProfile([FromForm] RequestUpdateUser request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var users = await _userServices.UpdateUserAsync(userId, request);

            return Ok(users);
        }

        [Authorize]
        [HttpPut("users/change-password")]
        public async Task<IActionResult> UpdateUserPassword([FromQuery] string userId, [FromBody] RequestUpdateUserHashPassword request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var users = await _userServices.ChangePasswordAsync(userId, request);

            return Ok(users);
        }

        [Authorize]
        [HttpGet("users/address")]
        public async Task<IActionResult> GetAllUsersAddress([FromQuery] string userId)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var address = await _addressServices.GetAllAddressByUserIdAsync(userId);
            if (address == null)
            {
                return NotFound();
            }

            return Ok(address);
        }

        [Authorize]
        [HttpGet("users/address/{addressId}")]
        public async Task<IActionResult> GetUsersAddressById([FromRoute] string addressId)
        {
            if (!TryGetUserId(out _))
            {
                return Unauthorized();
            }

            var address = await _addressServices.GetAddressByIdAsync(addressId);
            if (address == null)
            {
                return NotFound();
            }

            return Ok(address);
        }

        [Authorize]
        [HttpPost("users/address")]
        public async Task<IActionResult> CreateUsersAddress([FromQuery] string userId, [FromBody] RequestCreateAndUpdateAddress request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var status = await _addressServices.CreateUserAddressAsync(userId, request);
            return Ok(status);
        }

        [Authorize]
        [HttpPut("users/address")]
        public async Task<IActionResult> UpdateUsersAddress([FromQuery] string userId, [FromQuery] string addressId, [FromBody] RequestCreateAndUpdateAddress request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var status = await _addressServices.UpdateUserAddressAsync(addressId, request, userId);

            return Ok(status);
        }

        [Authorize]
        [HttpDelete("users/address")]
        public async Task<IActionResult> DeleteUsersAddress([FromQuery] string userId, [FromQuery] string addressId)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var status = await _addressServices.DeleteUserAddressAsync(addressId, userId);
            return Ok(status);
        }

        [Authorize(Roles = "Artisan")]
        [HttpPut("users/my-shop")]
        public async Task<IActionResult> UpdateShopProfile([FromQuery] string userId, [FromForm] RequestUpdateUserShop request)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var users = await _userServices.UpdateUserShopByIDAsync(userId, request);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        [HttpGet("users/shop")]
        public async Task<IActionResult> GetShopByUserId([FromQuery] string userId)
        {
            var users = await _userServices.GetUserShopByIDAsync(userId);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        private bool TryGetUserId(out string userId)
        {
            userId = User.GetUserId() ?? string.Empty;
            return !string.IsNullOrWhiteSpace(userId);
        }
    }
}
