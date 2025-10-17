using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
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


        [HttpPost("users")]
        public async Task<IActionResult> GetAllUsers([FromForm] RequestFilterUser? requestFilter)
        {
            var users = await _userServices.GetAllUsersAsync(requestFilter);
            if (users == null || !users.Any())
            {
                return NotFound();
            }
            return Ok(users);
        }

        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUsersById([FromRoute] string id)
        {
            var users = await _userServices.GetUserByIDAsync(id);
            if (users == null)
            {
                return NotFound();
            }
            return Ok(users);
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUsers([FromRoute] string id, [FromForm] RequestUpdateUser request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var users = await _userServices.UpdateUserAsync(id,request);
            
            return Ok(users);
        }

        [HttpGet("users/me")]
        public async Task<IActionResult> GetUsersProfile()
        {
            var userId = User.FindFirst("userId")?.Value;
            var users = await _userServices.GetUserByIDAsync(userId);
            if (users == null)
            {
                return NotFound();
            }
            return Ok(users);
        }
        [HttpGet("users/address")]
        public async Task<IActionResult> GetAllUsersAddress()
        {
            var userId = User.FindFirst("userId")?.Value;
            var address = await _addressServices.GetAllAddressByUserIdAsync(userId);
            if(address == null) return NotFound();
            return Ok(address);
        }

        [HttpPost("users/address")]
        public async Task<IActionResult> CreateUsersAddress([FromBody] RequestCreateAndUpdateAddress request)
        {
            var userId = User.FindFirst("userId")?.Value;
            var status = _addressServices.CreateUserAddressAsync(userId, request);
            return Ok(status);
        }

        [HttpPut("users/address/{id}")]
        public async Task<IActionResult> UpdateUsersAddress([FromRoute] string addressId)
        {
            
            
            return Ok();
        }
        [HttpDelete("users/address/{id}")]
        public async Task<IActionResult> DeleteUsersAddress([FromRoute] string addressId)
        {
            var status = _addressServices.DeleteUserAddressAsync(addressId);
            return Ok(status);
        }


    }
}
