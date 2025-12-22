namespace Backend_SEP490.DTOs.Request;

public class NotificationFilterRequest
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool? UnreadOnly { get; set; }
    public string? Type { get; set; }
}
