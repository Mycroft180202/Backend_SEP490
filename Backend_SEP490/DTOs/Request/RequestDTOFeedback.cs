namespace Backend_SEP490.DTOs.Request;

public class RequestDTOFeedback
{
    public string Id { get; set; }
    public string ProductId { get; set; }
    public string CustomerId { get; set; }
    public int? Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreateAt { get; set; }
    
}