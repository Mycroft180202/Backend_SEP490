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

        public UserController(IUserServices userServices)
        {
            _userServices = userServices;
        }


        [HttpPost("users")]
        public async Task<IActionResult> GetAllUsers([FromForm] RequestFilter? requestFilter)
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
    }
}
