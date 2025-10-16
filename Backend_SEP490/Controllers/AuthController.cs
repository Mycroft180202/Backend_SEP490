using Backend_SEP490.DTOs.Response;
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
    public async Task<IActionResult> Login([FromForm] LoginRequest request)
    {
        var result = await _userServices.LoginAsync(request.Username, request.Password);
        if (result == null) return Unauthorized("Invalid username or password");
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RequestDTORefresh request)
    {
        var result = await _userServices.RefreshTokenAsync(request.RefreshToken);
        if (result == null) return Unauthorized("Invalid refresh token");
        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RequestDTORefresh request)
    {
        var success = await _userServices.LogoutAsync(request.RefreshToken);
        if (!success) return BadRequest("Invalid refresh token");
        return Ok("Logged out successfully");
    }
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromForm] RequestDTORegister dto)
    {
        var result = await _userServices.RegisterAsync(dto);
        if (!result) return BadRequest("Username or email already exists");

        return Ok(new { message = "Register successful, role Customer assigned" });
    }

}

public class LoginRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
}
