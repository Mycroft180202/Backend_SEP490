using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Services.impl
{
    public class BlogPostServiceImpl : GenericServices, IBlogPostService
    {
        private readonly Cloudinary _cloudinary;
        public BlogPostServiceImpl(IMapper mapper, IUnitOfWork unitOfWork, Cloudinary cloudinary) : base(mapper, unitOfWork)
        {
            _cloudinary = cloudinary;
        }

        public async Task<string> CreateBlogPostAsync(string userid, RequestCreateBlogPost request)
        {

            var blogPosts = await _context.Blog.GetAllBlogPostAsync();
            var blogId = "B001";
            if (blogPosts.Any())
            {
                blogId = blogPosts.OrderByDescending(b => b.Id).FirstOrDefault().Id;
            }
            string url = "";

            if (request.Image != null)
            {
                using var stream = request.Image.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(request.Image.FileName, stream)
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                url = uploadResult.SecureUrl.ToString();
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
                Image = url,
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

            string url = blogPost.Image;

            if (request.Image != null)
            {
                using var stream = request.Image.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(request.Image.FileName, stream)
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                url = uploadResult.SecureUrl.ToString();
            }
            var updateStatus = await _context.Blog.UpdateBlogPostAsync(blogPost, request, url);
            return updateStatus;
        }
    }
}
