using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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


        [HttpPost("users/{pageIndex}/{pageSize}")]
        public async Task<IActionResult> GetAllUsers([FromBody] RequestFilterUser? requestFilter, [FromRoute] int pageIndex, [FromRoute] int pageSize)
        {
            var users = await _userServices.GetAllUsersAsync(requestFilter, pageIndex, pageSize);
            if (users == null)
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
        public async Task<IActionResult> UpdateUsers([FromRoute] string id, [FromBody] RequestUpdateUser request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var users = await _userServices.UpdateUserAsync(id,request);
            
            return Ok(users);
        }

        [HttpGet("users/me")]
        public async Task<IActionResult> GetUsersProfile()
        {
            var userId = User.FindFirstValue("userID");
            var users = await _userServices.GetUserByIDAsync(userId);
            if (users == null)
            {
                return NotFound();
            }
            return Ok(users);
        }

        
        [HttpPut("users/me")]
        public async Task<IActionResult> UpdateUsersProfile([FromBody] RequestUpdateUser request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var userId = User.FindFirstValue("userID");



            var users = await _userServices.UpdateUserAsync(userId, request);

            return Ok(users);
        }
        [HttpPut("users/change-password")]
        public async Task<IActionResult> UpdateUserPassword([FromBody] RequestUpdateUserHashPassword request)
        {
            var userId = User.FindFirstValue("userID");
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var users = await _userServices.ChangePasswordAsync(userId, request);

            return Ok(users);
        }

        [HttpGet("users/address")]
        public async Task<IActionResult> GetAllUsersAddress()
        {
            var userId = User.FindFirstValue("userID");
            var address = await _addressServices.GetAllAddressByUserIdAsync(userId);
            if(address == null) return NotFound();
            return Ok(address);
        }

        [HttpPost("users/address")]
        public async Task<IActionResult> CreateUsersAddress([FromBody] RequestCreateAndUpdateAddress request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var userId = User.FindFirstValue("userID");
            var status = await _addressServices.CreateUserAddressAsync(userId, request);
            return Ok(status);
        }

        [HttpPut("users/address/{id}")]
        public async Task<IActionResult> UpdateUsersAddress([FromRoute] string addressId, [FromBody] RequestCreateAndUpdateAddress request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var status = await _addressServices.UpdateUserAddressAsync(addressId, request);
            
            return Ok(status);
        }
        [HttpDelete("users/address/{id}")]
        public async Task<IActionResult> DeleteUsersAddress([FromRoute] string addressId)
        {
            var status = await _addressServices.DeleteUserAddressAsync(addressId);
            return Ok(status);
        }


    }
}
