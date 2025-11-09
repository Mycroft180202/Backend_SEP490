using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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

        [HttpGet("blogs/{pageIndex}/{pageSize}")]
        public async Task<IActionResult> GetAllBlogPost([FromRoute] int pageIndex, [FromRoute] int pageSize)
        {
            var blog = await _blogPostService.GetAllBlogPostAsync(pageIndex, pageSize);
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
        public async Task<IActionResult> UpdateBlogPost([FromRoute] string blogId, [FromBody] RequestUpdateBlogPost request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var blog = await _blogPostService.UpdateBlogPostAsync(blogId, request);
            return Ok(blog);
        }
        [HttpPost("blogs")]
        public async Task<IActionResult> CreateBlogPost([FromBody] RequestCreateBlogPost request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var userId = User.FindFirstValue("userID");
            var status = await _blogPostService.CreateBlogPostAsync(userId, request);
            return Ok(status);
        }
    }
}
