using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IBlogRepositories
    {
        public Task<IEnumerable<BlogPost>> GetAllBlogPostAsync();
        public Task<BlogPost> GetBlogByIdAsync(string blogId);
        public Task<string> UpdateBlogPostAsync(BlogPost blog, RequestUpdateBlogPost request, string url);
        public Task<string> CreateBlogPostAsync(BlogPost blog);
        public Task<string> DeleteBlogPostAsync(BlogPost blog);
    }
}
