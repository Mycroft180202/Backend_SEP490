namespace Backend_SEP490.DTOs.Request;

public class RequestDTOProductImages
{
    public string Id { get; set; }
    public string ProductId { get; set; }
    public string? URL { get; set; }
    public int? Position { get; set; }

}