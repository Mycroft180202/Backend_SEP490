using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Route("api/seller/shipping-profile")]
[ApiController]
[Authorize]
public class SellerShippingProfileController : ControllerBase
{
    private readonly ISellerShippingProfileService _profileService;

    public SellerShippingProfileController(ISellerShippingProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var sellerId = GetUserId();
        if (sellerId == null)
        {
            return Unauthorized();
        }

        var profile = await _profileService.GetMyProfileAsync(sellerId);
        return Ok(profile);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpsertMyProfile([FromBody] UpsertSellerShippingProfileRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var sellerId = GetUserId();
        if (sellerId == null)
        {
            return Unauthorized();
        }

        var profile = await _profileService.UpsertMyProfileAsync(sellerId, request);
        return Ok(profile);
    }

    private string? GetUserId() => User.GetUserId();
}
