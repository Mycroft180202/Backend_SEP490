namespace Backend_SEP490.DTOs.Response;

public class ResponseArtisanApplicationDto
{
    public string Id { get; set; }
    public string UserId { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string IdentityNumber { get; set; }
    public string? IdentityFrontImage { get; set; }
    public string? IdentityBackImage { get; set; }
    public string? PortfolioUrl { get; set; }
    public string? SkillDescription { get; set; }
    public int? YearsOfExperience { get; set; }
    public string? WorkshopAddress { get; set; }
    public string? ShopName { get; set; }
    public string? Bio { get; set; }
    public string Status { get; set; }
    public string? AdminNote { get; set; }
    public string? RejectReason { get; set; }
    public string? ReviewedBy { get; set; }
    public string? ReviewerName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
