using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class BlogPost
{
    [Key]
    public string Id { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }
    public string AuthorId { get; set; }
    public string PostStatus { get; set; }
    public DateTime PublishedAt { get; set; }
    [JsonIgnore]
    public User Author { get; set; }
}
