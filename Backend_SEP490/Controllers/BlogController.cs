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
    [Authorize]
    public class BlogController : ControllerBase
    {
        private readonly IBlogPostService _blogPostService;

        public BlogController(IBlogPostService blogPostService)
        {
            _blogPostService = blogPostService;
        }

        [AllowAnonymous]
        [HttpGet("blogs")]
        public async Task<IActionResult> GetAllBlogPost([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 3)
        {
            var blog = await _blogPostService.GetAllBlogPostAsync(pageIndex, pageSize);
            if (blog == null)
            {
                return NotFound();
            }

            return Ok(blog);
        }

        [AllowAnonymous]
        [HttpGet("blogs/{id}")]
        public async Task<IActionResult> GetBlogPostById([FromRoute] string id)
        {
            var blog = await _blogPostService.GetBlogByIdAsync(id);
            if (blog == null)
            {
                return NotFound();
            }

            return Ok(blog);
        }

        [Authorize]
        [HttpPut("blogs")]
        public async Task<IActionResult> UpdateBlogPost([FromQuery] string id, [FromForm] RequestUpdateBlogPost request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var blog = await _blogPostService.UpdateBlogPostAsync(id, request);
            return Ok(blog);
        }

        [Authorize]
        [HttpDelete("blogs")]
        public async Task<IActionResult> DeleteBlogPost([FromQuery] string id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var blog = await _blogPostService.DeleteBlogPostAsync(id);
            return Ok(blog);
        }

        [Authorize]
        [HttpPost("blogs")]
        public async Task<IActionResult> CreateBlogPost([FromForm] RequestCreateBlogPost request)
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

            var status = await _blogPostService.CreateBlogPostAsync(userId, request);
            return Ok(status);
        }
    }
}
