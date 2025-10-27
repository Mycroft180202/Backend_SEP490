using AutoMapper;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper
{
    public class BlogPostMapper :Profile
    {
        public BlogPostMapper() 
        {
            CreateMap<BlogPost,ResponseDTOBlogPost>().ReverseMap();
        }
    }
}
