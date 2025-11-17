using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class ReviewArtisanApplicationRequest
{
    [Required]
    public bool Approve { get; set; }

    public string? AdminNote { get; set; }
    public string? RejectReason { get; set; }
}
