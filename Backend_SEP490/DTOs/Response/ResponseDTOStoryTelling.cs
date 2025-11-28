using Backend_SEP490.Models;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOStoryTelling
    {
        public int Id { get; set; }
        public string ProductId { get; set; }
        public string StoryType { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Image { get; set; }
        public string CreatedById { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
