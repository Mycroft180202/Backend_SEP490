using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
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

    [Authorize]
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
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        else
        {
            var result = await _userServices.RegisterAsync(dto);
            if (!result) return BadRequest("Username or email already exists!");
            return Ok("OTP sent to email");
        }
    }
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] RequestDTOVerifyOtp request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        else
        {
            var result = await _userServices.VerifyOtpAsync(request.RegisterDto, request.Otp);
            if (!result) return BadRequest("Invalid or expired OTP!");
            return Ok("Registration successful");
        }
    }
    
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] string email)
    {
        var result = await _userServices.ForgotPasswordAsync(email);
        if (!result) return BadRequest("Email không tồn tại trong hệ thống.");

        return Ok("OTP đã được gửi tới email của bạn.");
    }
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] RequestDTOResetPassword dto)
    {
        var result = await _userServices.ResetPasswordAsync(dto);
        if (!result) return BadRequest("OTP không hợp lệ hoặc đã hết hạn.");

        return Ok("Mật khẩu đã được đặt lại thành công.");
    }
}

public class LoginRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
}
