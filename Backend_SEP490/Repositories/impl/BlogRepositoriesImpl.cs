using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl
{
    public class BlogRepositoriesImpl : GenericRepositoryImpl<BlogPost>, IBlogRepositories
    {
        public BlogRepositoriesImpl(AppDbContext context) : base(context)
        {
        }

        public async Task<string> CreateBlogPostAsync(BlogPost blog)
        {
            try
            {
                _context.BlogPosts.Add(blog);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine(ex);
                return "Create Blog failed!";
            }
            return "Create Blog successfully!";
        }

        public async Task<IEnumerable<BlogPost>> GetAllBlogPostAsync()
        {
           return await _context.BlogPosts.ToListAsync();
        }

        public async Task<BlogPost> GetBlogByIdAsync(string blogId)
        {
            var blogPost = await _context.BlogPosts.Where(b => b.Id == blogId).FirstOrDefaultAsync();
            return blogPost;
        }

        public async Task<string> UpdateBlogPostAsync(BlogPost blog, RequestUpdateBlogPost request, string url)
        {
            try
            {
                blog.Title = request.Title;
                blog.Content = request.Content;
                blog.PostStatus = request.PostStatus;
                blog.Image = url;
            }
            catch(Exception ex)
            {
                System.Diagnostics.Debug.WriteLine(ex);
                return "Update Blog information failed!";
            }
            try 
            {
                _context.BlogPosts.Update(blog);
                _context.SaveChanges();
            }
            catch(Exception ex) 
            {
                System.Diagnostics.Debug.WriteLine(ex);
                return "Update Blog failed!";
            }
            return "Update Blog successfully!";
        }
    }
}
