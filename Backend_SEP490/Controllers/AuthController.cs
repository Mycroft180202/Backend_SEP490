using Backend_SEP490.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;
[Microsoft.AspNetCore.Components.Route("api/[controller]")]
[ApiController]

public class AuthController: ControllerBase
{
    private readonly IUserServices _userServices;

    public AuthController(IUserServices userServices)
    {
        _userServices = userServices;
    }
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var token = await _userServices.LoginAsync(request.Username, request.Password);

        if (token == null)
            return Unauthorized(new { message = "Invalid username or password" });

        return Ok(new { token });
    }
}
public class LoginRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
}