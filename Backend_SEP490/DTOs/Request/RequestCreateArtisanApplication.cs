using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class RequestCreateArtisanApplication
{
    [Required]
    public string FullName { get; set; }

    [Required, EmailAddress]
    public string Email { get; set; }

    [Required, Phone]
    public string PhoneNumber { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [Required]
    public string IdentityNumber { get; set; }

    public string? IdentityFrontImage { get; set; }
    public string? IdentityBackImage { get; set; }
    public string? PortfolioUrl { get; set; }

    [Required]
    public string SkillDescription { get; set; }
    public int? YearsOfExperience { get; set; }

    [Required]
    public string WorkshopAddress { get; set; }
    public string? ShopName { get; set; }
    public string? Bio { get; set; }
}
