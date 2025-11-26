using System.Linq;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentController> _logger;
    public PaymentController(IPaymentService paymentService,ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    [HttpPost("vnpay")]
    [Authorize]
    public async Task<IActionResult> CreateVnpayPayment([FromBody] CreateVnpayPaymentRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.GetUserId();
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

    [AllowAnonymous]
    [HttpGet("vnpay/callback")]
    public async Task<IActionResult> HandleVnpayCallback()
    {
        _logger.LogInformation("VNPay callback query: {QueryString}", Request.QueryString.Value);
        _logger.LogInformation("VNPay callback keys: {Keys}", string.Join(",", Request.Query.Keys));
        var result = await _paymentService.HandleVnpayCallbackAsync(Request.Query);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        var queryString = Request.QueryString.HasValue ? Request.QueryString.Value : string.Empty;
        var Cors__AllowedOrigins__0 = Environment.GetEnvironmentVariable("Cors__AllowedOrigins__0");
        var redirectUrl = $"{Cors__AllowedOrigins__0}/payment-result{queryString}";
        _logger.LogInformation("Redirecting VNPay callback to {RedirectUrl}", redirectUrl);
        return Redirect(redirectUrl);
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
