using System.Linq;
using Backend_SEP490.DTOs.External.Ghn;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
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

    public GhnShippingController(IGhnShippingService ghnShippingService)
    {
        _ghnShippingService = ghnShippingService;
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
