using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Services.impl
{
    public class BlogPostServiceImpl : GenericServices, IBlogPostService
    {
        public BlogPostServiceImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
        {
        }

        public async Task<string> CreateBlogPostAsync(string userid, RequestCreateBlogPost request)
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
            var blog = new BlogPost
            {
                Id = $"B{nextNumber:D3}",
                Title = request.Title,
                Content = request.Content,
                Image = request.Image,
                AuthorId = userid,
                PostStatus = "Active",
                PublishedAt = DateTime.UtcNow
            };

            var status = await _context.Blog.CreateBlogPostAsync(blog);
            return status;
        }

        public async Task<PagedResult<ResponseDTOBlogPost>> GetAllBlogPostAsync(int pageIndex, int pageSize)
        {
            var blogPostsList = await _context.Blog.GetAllBlogPostAsync();
            int totalCount = blogPostsList.Count();
            blogPostsList = blogPostsList.Skip((pageIndex - 1) * pageSize).Take(pageSize).ToList();


            var blogPosts = _mapper.Map<IEnumerable<ResponseDTOBlogPost>>(blogPostsList);

            return new PagedResult<ResponseDTOBlogPost>
            {
                Items = blogPosts,
                TotalCount = totalCount,
                PageIndex = pageIndex,
                PageSize = pageSize
            };
        }

        public async Task<ResponseDTOBlogPost> GetBlogByIdAsync(string blogId)
        {
            var blogPost = await _context.Blog.GetBlogByIdAsync(blogId);

            return _mapper.Map<ResponseDTOBlogPost>(blogPost);
        }

        public async Task<string> UpdateBlogPostAsync(string blogId, RequestUpdateBlogPost request)
        {
            var blogPost = await _context.Blog.GetBlogByIdAsync(blogId);
            if (blogPost == null) return "Blog not found!";

            var updateStatus = await _context.Blog.UpdateBlogPostAsync(blogPost, request);
            return updateStatus;
        }
    }
}
