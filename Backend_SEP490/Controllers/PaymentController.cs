using System.Linq;
using System.Security.Claims;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpPost("vnpay")]
    [Authorize]
    public async Task<IActionResult> CreateVnpayPayment([FromBody] CreateVnpayPaymentRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.FindFirstValue("userId") ?? User.FindFirstValue("userID");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        var clientIp = !string.IsNullOrWhiteSpace(forwarded)
            ? forwarded.Split(',').FirstOrDefault()
            : HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var response = await _paymentService.CreateVnpayPaymentAsync(userId, request, clientIp);
        if (response == null)
        {
            return BadRequest(new { message = "Unable to initiate payment for this order." });
        }

        return Ok(response);
    }

    [HttpGet("vnpay/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleVnpayCallback()
    {
        var result = await _paymentService.HandleVnpayCallbackAsync(Request.Query);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPut("status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdatePaymentStatusRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _paymentService.UpdatePaymentStatusAsync(request);
        if (!result.Contains("success", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
