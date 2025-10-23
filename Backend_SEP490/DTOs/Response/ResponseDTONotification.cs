using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class ResponseDTONotification
{
    public string Id { get; set; }

    [Required]
    public string Message { get; set; }

    [Required]
    public string Type { get; set; }

    public bool IsRead { get; set; }
    public DateTime? CreateAt { get; set; }
}