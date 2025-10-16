using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers
{
    [Microsoft.AspNetCore.Components.Route("api/[controller]")]
    [ApiController]
    public class BlogController : ControllerBase
    {
        private IBlogPostService _blogPostService; 

        public BlogController(IBlogPostService blogPostService)
        {
            _blogPostService = blogPostService;
        }

        [HttpGet("blogs")]
        public async Task<IActionResult> GetAllBlogPost()
        {
            var blog = _blogPostService.GetAllBlogPostAsync();
            if (blog == null) NotFound();
            return Ok(blog);
        }

        [HttpGet("blogs/{id}")]
        public async Task<IActionResult> GetBlogPostById([FromRoute] string blogId)
        {
            var blog = await _blogPostService.GetAllOrderByIdAsync(blogId);
            if (blog == null) NotFound();
            return Ok(blog);
        }
        [HttpPut("blogs/{id}")]
        public async Task<IActionResult> UpdateBlogPost([FromRoute] string blogId, [FromForm] RequestUpdateBlogPost request)
        {
            var blog = await _blogPostService.UpdateBlogPostAsync(blogId, request);
            return Ok(blog);
        }
        [HttpPost("blogs")]
        public async Task<IActionResult> CreateBlogPost( [FromForm] RequestCreateBlogPost request)
        {
            var userId = User.FindFirst("userId")?.Value;
            var status = await _blogPostService.CreateBlogPostAsync(userId, request);
            return Ok(status);
        }
    }
}
