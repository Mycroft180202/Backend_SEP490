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


        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers(string? search, bool? status)
        {
            var users = await _userServices.GetAllUsersAsync(search, status);
            if (users == null || !users.Any())
            {
                return NotFound();
            }
            return Ok(users);
        }

        
    }
}
