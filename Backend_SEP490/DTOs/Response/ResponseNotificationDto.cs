namespace Backend_SEP490.DTOs.Response;

public class ResponseNotificationDto
{
    public string Id { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public string Message { get; set; } = default!;
    public string Type { get; set; } = default!;
    public bool IsRead { get; set; }
    public DateTime? CreateAt { get; set; }
}
