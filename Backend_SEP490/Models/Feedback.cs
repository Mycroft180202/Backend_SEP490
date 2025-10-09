using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.Models;

public class Feedback
{
    [Key]
    public string Id { get; set; }
    public string ProductId { get; set; }
    public string CustomerId { get; set; }
    public int? Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreateAt { get; set; }

    public Product Product { get; set; }
    public User Customer { get; set; }
}
