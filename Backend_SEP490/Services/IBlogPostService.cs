using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Services
{
    public interface IBlogPostService
    {
        public Task<PagedResult<ResponseDTOBlogPost>> GetAllBlogPostAsync(int pageIndex, int pageSize);
        public Task<ResponseDTOBlogPost> GetBlogByIdAsync(string blogId);
        public Task<string> UpdateBlogPostAsync(string blogId, RequestUpdateBlogPost request);
        public Task<string> DeleteBlogPostAsync(string blogId);
        public Task<string> CreateBlogPostAsync(string userid,RequestCreateBlogPost request);
    }
}
