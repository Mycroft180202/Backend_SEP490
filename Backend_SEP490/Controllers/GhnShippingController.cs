using System;
using System.Linq;
using Backend_SEP490.DTOs.External.Ghn;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Route("api/ghn/shipping")]
[ApiController]
[Authorize]
public class GhnShippingController : ControllerBase
{
    private readonly IGhnShippingService _ghnShippingService;
    private readonly IOrderService _orderService;

    public GhnShippingController(IGhnShippingService ghnShippingService, IOrderService orderService)
    {
        _ghnShippingService = ghnShippingService;
        _orderService = orderService;
    }

    [HttpPost("fee/test")]
    public async Task<IActionResult> CalculateFee(
        [FromBody] CalculateShippingFeeRequest request,
        CancellationToken cancellationToken)
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

        var preview = await _orderService.PreviewCartShippingFeeAsync(
            userId,
            request.ToDistrictId,
            request.ToWardCode,
            request.ServiceId,
            request.ServiceTypeId);

        if (!preview.Success)
        {
            return BadRequest(new { message = preview.Message ?? "Unable to calculate shipping fee." });
        }

        var roundedFee = (int)Math.Round(preview.Fee, 0, MidpointRounding.AwayFromZero);
        var result = new ShippingFeeResponse
        {
            TotalFee = roundedFee
        };

        return Ok(result);
    }

    [AllowAnonymous]
    [HttpPost("fee")]
    public async Task<IActionResult> CalculateFeeSimple(
        [FromBody] SimpleShippingFeeRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var preview = await _orderService.PreviewSimpleShippingFeeAsync(
            request.ToDistrictId,
            request.ToWardCode,
            request.ServiceId,
            request.ServiceTypeId);

        if (!preview.Success)
        {
            return BadRequest(new { message = preview.Message ?? "Unable to calculate shipping fee." });
        }

        var roundedFee = (int)Math.Round(preview.Fee, 0, MidpointRounding.AwayFromZero);
        var result = new ShippingFeeResponse
        {
            TotalFee = roundedFee
        };

        return Ok(result);
    }
}
