using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers
{
    [Microsoft.AspNetCore.Components.Route("api/[controller]")]
    [ApiController]
    public class StoryTellingController : ControllerBase
    {
        private readonly IStoryTellingService _storyTellingService;

        public StoryTellingController(IStoryTellingService storyTellingService)
        {
            _storyTellingService = storyTellingService;
        }
        [AllowAnonymous]
        [HttpGet("product/story-telling")]
        public async Task<IActionResult> GetAllStoryTellingByProductIdAsync([FromQuery] string productId)
        {
            var storyTellings = await _storyTellingService.GetAllStoryTellingByProductIdAsync(productId);
            return Ok(storyTellings);
        }

        [AllowAnonymous]
        [HttpGet("product/story-telling/{storyTellingId}")]
        public async Task<IActionResult> GetStoryTellingByIdAsync( int storyTellingId)
        {
            var storyTellings = await _storyTellingService.GetStoryTellingByIdAsync(storyTellingId);
            return Ok(storyTellings);
        }

        [Authorize(Roles = "Artisan")]
        [HttpPost("product/story-telling")]
        public async Task<IActionResult> CreateStoryTellingAsync([FromForm] RequestCreateStoryTelling request)
        {

            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var storyTellings = await _storyTellingService.CreateStoryTellingAsync(userId, request);
            return Ok(storyTellings);
        }

        [Authorize(Roles = "Artisan")]
        [HttpPut("product/story-telling")]
        public async Task<IActionResult> UpdateStoryTellingAsync([FromQuery] int storyTellingId,[FromForm] RequestUpdateStoryTelling request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.Image != null)
            {
                var ext = Path.GetExtension(request.Image.FileName).ToLower();
                var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };

                if (!allowed.Contains(ext))
                {
                    return BadRequest("Only jpg, jpeg, png or webp images are supported.");
                }
            }

            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var storyTellings = await _storyTellingService.UpdateStoryTellingAsync(storyTellingId, request);
            return Ok(storyTellings);
        }

        [Authorize(Roles = "Artisan")]
        [HttpDelete("product/story-telling")]
        public async Task<IActionResult> DeleteStoryTellingAsync([FromQuery] int storyTellingId)
        {

            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var storyTellings = await _storyTellingService.DeleteStoryTellingAsync(storyTellingId);
            return Ok(storyTellings);
        }

        private bool TryGetUserId(out string userId)
        {
            userId = User.GetUserId() ?? string.Empty;
            return !string.IsNullOrWhiteSpace(userId);
        }
    }
}
