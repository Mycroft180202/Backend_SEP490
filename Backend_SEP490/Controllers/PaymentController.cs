using System;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text.Json;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentController> _logger;
    private readonly IDataProtector _payloadProtector;
    private const string VnpayPayloadPurpose = "PaymentController.VnpayPayload";

    public PaymentController(IPaymentService paymentService, ILogger<PaymentController> logger, IDataProtectionProvider dataProtectionProvider)
    {
        _paymentService = paymentService;
        _logger = logger;
        ArgumentNullException.ThrowIfNull(dataProtectionProvider);
        _payloadProtector = dataProtectionProvider.CreateProtector(VnpayPayloadPurpose);
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

        var protectedPayload = BuildEncryptedPayload(result);
        var legacyResponseCode = result.Success
            ? "00"
            : string.Equals(result.Status, "pending", StringComparison.OrdinalIgnoreCase)
                ? "24"
                : "99";
        var frontendOrigin = Environment.GetEnvironmentVariable("Cors__AllowedOrigins__0") ??
                             $"{Request.Scheme}://{Request.Host.Value}";
        var redirectUrl =
            $"{frontendOrigin?.TrimEnd('/')}/payment-result?payload={WebUtility.UrlEncode(protectedPayload)}&vnp_ResponseCode={legacyResponseCode}";
        _logger.LogInformation("Redirecting VNPay callback to {RedirectUrl}", redirectUrl);
        return Redirect(redirectUrl);
    }

    [AllowAnonymous]
    [HttpGet("vnpay/result")]
    public IActionResult GetVnpayResult([FromQuery] string payload)
    {
        if (string.IsNullOrWhiteSpace(payload))
        {
            return BadRequest(new { message = "Payload is required." });
        }

        try
        {
            var json = _payloadProtector.Unprotect(payload);
            var result = JsonSerializer.Deserialize<VnpayCallbackResult>(json);
            if (result == null)
            {
                return BadRequest(new { message = "Unable to decode payload." });
            }

            return Ok(result);
        }
        catch (Exception ex) when (ex is CryptographicException || ex is JsonException)
        {
            _logger.LogWarning(ex, "Invalid VNPay payload.");
            return BadRequest(new { message = "Invalid payload." });
        }
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

    private string BuildEncryptedPayload(VnpayCallbackResult result)
    {
        if (result == null)
        {
            throw new ArgumentNullException(nameof(result));
        }

        result.IssuedAt = DateTimeOffset.UtcNow;
        var json = JsonSerializer.Serialize(result);
        return _payloadProtector.Protect(json);
    }
}
