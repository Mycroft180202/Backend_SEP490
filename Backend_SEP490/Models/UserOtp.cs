using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.Models;

public class UserOtp
{
    [Key]
    public string Id { get; set; }

    [Required]
    public string Email { get; set; }

    [Required]
    public string OtpCode { get; set; }

    [Required]
    public DateTime ExpiresAt { get; set; }

    public bool IsUsed { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}