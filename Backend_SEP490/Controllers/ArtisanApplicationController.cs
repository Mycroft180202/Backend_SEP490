using Backend_SEP490.Constants;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ArtisanApplicationController : ControllerBase
{
    private readonly IArtisanApplicationService _artisanApplicationService;

    public ArtisanApplicationController(IArtisanApplicationService artisanApplicationService)
    {
        _artisanApplicationService = artisanApplicationService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] RequestCreateArtisanApplication request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (request.IdentityBackImageFile != null)
        {
            var ext = Path.GetExtension(request.IdentityBackImageFile.FileName).ToLower();
            var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };

            if (!allowed.Contains(ext))
            {
                return BadRequest("Only jpg, jpeg, png or webp images are supported.");
            }
        }

        if (request.IdentityFrontImageFile != null)
        {
            var ext = Path.GetExtension(request.IdentityFrontImageFile.FileName).ToLower();
            var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };

            if (!allowed.Contains(ext))
            {
                return BadRequest("Only jpg, jpeg, png or webp images are supported.");
            }
        }

        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await _artisanApplicationService.CreateAsync(userId, request);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }

        return Ok(result.Data);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyApplication()
    {
        var userId = GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var application = await _artisanApplicationService.GetMyApplicationAsync(userId);
        if (application == null)
        {
            return NotFound("No artisan application found.");
        }

        return Ok(application);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] ArtisanApplicationFilterRequest filterRequest)
    {
        var result = await _artisanApplicationService.GetAllAsync(filterRequest ?? new ArtisanApplicationFilterRequest());
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById([FromRoute] string id)
    {
        var application = await _artisanApplicationService.GetByIdAsync(id);
        if (application == null)
        {
            return NotFound();
        }

        return Ok(application);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/review")]
    public async Task<IActionResult> Review([FromRoute] string id, [FromBody] ReviewArtisanApplicationRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminId = GetUserId();
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return Unauthorized();
        }

        var result = await _artisanApplicationService.ReviewAsync(adminId, id, request);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }

        return Ok(new
        {
            applicationId = id,
            status = request.Approve ? ArtisanApplicationStatus.Done : ArtisanApplicationStatus.Rejected,
            message = result.Message
        });
    }

    private string? GetUserId() => User.GetUserId();
}
