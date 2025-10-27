using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IBlogRepositories
    {
        public Task<IEnumerable<BlogPost>> GetAllBlogPostAsync();
        public Task<BlogPost> GetAllOrderByIdAsync(string blogId);
        public Task<bool> UpdateBlogPostAsync(BlogPost blog, RequestUpdateBlogPost request);
        public Task<bool> CreateBlogPostAsync(BlogPost blog);
    }
}
