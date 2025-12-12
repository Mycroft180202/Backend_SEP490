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

    [AllowAnonymous]
    [HttpPost("fee")]
    public async Task<IActionResult> CalculateFee(
        [FromBody] CalculateShippingFeeRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.GetUserId();
        if (!string.IsNullOrWhiteSpace(userId))
        {
            var preview = await _orderService.PreviewCartShippingFeeAsync(userId, request.ToDistrictId, request.ToWardCode);
            if (preview.Success)
            {
                var roundedFee = (int)Math.Round(preview.Fee, 0, MidpointRounding.AwayFromZero);
                var previewResult = new ShippingFeeResponse
                {
                    TotalFee = roundedFee
                };

                return Ok(previewResult);
            }
        }

        var serviceRequest = new GhnCalculateFeeRequest
        {
            ToDistrictId = request.ToDistrictId,
            ToWardCode = request.ToWardCode
        };

        var response = await _ghnShippingService.CalculateShippingFeeAsync(serviceRequest, cancellationToken);
        if (response == null)
        {
            return StatusCode(500, new { message = "Unable to request GHN shipping fee at the moment." });
        }

        var successCodes = new[] { 0, 200 };
        if (!successCodes.Contains(response.Code) || response.Data == null)
        {
            return BadRequest(new { response.Code, response.Message });
        }

        var result = new ShippingFeeResponse
        {
            TotalFee = response.Data.Total
        };

        return Ok(result);
    }
}
