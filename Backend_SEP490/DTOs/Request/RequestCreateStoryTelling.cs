namespace Backend_SEP490.DTOs.Request
{
    public class RequestCreateStoryTelling
    {
        public string ProductId { get; set; }
        public string StoryType { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public IFormFile Image { get; set; }
    }
}
