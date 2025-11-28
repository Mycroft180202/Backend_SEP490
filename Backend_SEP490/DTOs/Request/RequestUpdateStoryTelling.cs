using System.Diagnostics.CodeAnalysis;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestUpdateStoryTelling
    {
        public string StoryType { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public IFormFile Image { get; set; }
    }
}
