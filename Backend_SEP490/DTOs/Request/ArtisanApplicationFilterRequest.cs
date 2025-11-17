namespace Backend_SEP490.DTOs.Request;

public class ArtisanApplicationFilterRequest
{
    public string? Status { get; set; }
    public string? Keyword { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
