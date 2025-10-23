using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl
{
    public class BlogPostServiceImpl : GenericServices, IBlogPostService
    {
        public BlogPostServiceImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
        {
        }

        public async Task<bool> CreateBlogPostAsync(string userid, RequestCreateBlogPost request)
        {
            
            var blogPosts = await _context.Blog.GetAllBlogPostAsync();
            var blogId = "B001";
            if (blogPosts.Any()) 
            {
                blogId = blogPosts.OrderByDescending(b => b.Id).FirstOrDefault().Id;
            }
            
            int nextNumber = 1;
            if (!"B001".Equals(blogId)) 
            {
               nextNumber = int.Parse(blogId.Substring(1)) + 1;
            }
            var blog = new BlogPost { 
                Id = $"B{nextNumber:D3}",
                Title = request.Title ,
                Content = request.Content ,
                Image = request.Image ,
                AuthorId = userid ,
                PostStatus = "Active",
                PublishedAt = DateTime.UtcNow
            };

            var status = await _context.Blog.CreateBlogPostAsync(blog);
            return status;
        }

        public async Task<IEnumerable<ResponseDTOBlogPost>> GetAllBlogPostAsync()
        {
           var blogPosts = await _context.Blog.GetAllBlogPostAsync();
            return _mapper.Map<IEnumerable<ResponseDTOBlogPost>>(blogPosts);
        }

        public async Task<ResponseDTOBlogPost> GetAllOrderByIdAsync(string blogId)
        {
            var blogPost = await _context.Blog.GetAllOrderByIdAsync(blogId);
            return _mapper.Map<ResponseDTOBlogPost>(blogPost);
        }

        public async Task<bool> UpdateBlogPostAsync(string blogId, RequestUpdateBlogPost request)
        {
            var blogPost = await _context.Blog.GetAllOrderByIdAsync(blogId);
            if (blogPost == null) return false;

            var updateStatus = await _context.Blog.UpdateBlogPostAsync(blogPost, request);
            return updateStatus;
        }
    }
}
