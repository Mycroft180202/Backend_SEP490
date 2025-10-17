namespace Backend_SEP490.DTOs.Request;

public class ResponseDTOFeedback
{
    public string Id { get; set; }
    public string ProductId { get; set; }
    public string CustomerId { get; set; }
    public string CustomerName { get; set; }
    public int? Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreateAt { get; set; }
    
}