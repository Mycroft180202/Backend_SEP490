using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class AdminSendNotificationRequest
{
    [Required]
    public string TargetUserId { get; set; } = default!;

    [Required]
    [StringLength(500)]
    public string Message { get; set; } = default!;

    [Required]
    [StringLength(100)]
    public string Type { get; set; } = default!;
}
