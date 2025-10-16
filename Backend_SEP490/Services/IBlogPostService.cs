using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services
{
    public interface IBlogPostService
    {
        public Task<IEnumerable<ResponseDTOBlogPost>> GetAllBlogPostAsync();
        public Task<ResponseDTOBlogPost> GetAllOrderByIdAsync(string blogId);
        public Task<bool> UpdateBlogPostAsync(string blogId, RequestUpdateBlogPost request);
        public Task<bool> CreateBlogPostAsync(string userid,RequestCreateBlogPost request);
    }
}
