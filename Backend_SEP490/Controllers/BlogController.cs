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
        public async Task<IActionResult> GetBlogPostById([FromRoute] string orderId)
        {
            var blog = await _blogPostService.GetAllOrderByIdAsync(orderId);
            if (blog == null) NotFound();
            return Ok(blog);
        }
        [HttpPut("blogs/{id}")]
        public async Task<IActionResult> UpdateBlogPost([FromRoute] string orderId, [FromForm] RequestUpdateBlogPost request)
        {
            var blog = await _blogPostService.UpdateBlogPostAsync(orderId, request);
            return Ok(blog);
        }
    }
}
