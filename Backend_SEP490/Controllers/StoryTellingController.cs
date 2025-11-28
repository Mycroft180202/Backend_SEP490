using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers
{
    [Route("api/[controller]")]
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

            var userId = User.GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var storyTellings = await _storyTellingService.GetAllStoryTellingByProductIdAsync(productId);
            return Ok(storyTellings);
        }

        [AllowAnonymous]
        [HttpGet("product/story-telling/{storyTellingId}")]
        public async Task<IActionResult> GetStoryTellingByIdAsync( int storyTellingId)
        {

            var userId = User.GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

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
