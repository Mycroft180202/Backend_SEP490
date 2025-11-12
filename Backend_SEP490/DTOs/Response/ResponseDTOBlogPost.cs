namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOBlogPost
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Image { get; set; }
        public string AuthorId { get; set; }
        public string PostStatus { get; set; }
        public DateTime PublishedAt { get; set; }
    }
}
