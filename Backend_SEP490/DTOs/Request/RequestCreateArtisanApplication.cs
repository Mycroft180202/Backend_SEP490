using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

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

    [Required]
    public IFormFile? IdentityFrontImageFile { get; set; }

    [Required]
    public IFormFile? IdentityBackImageFile { get; set; }

    [Required]
    public string SkillDescription { get; set; }
    public int? YearsOfExperience { get; set; }

    [Required]
    public string WorkshopAddress { get; set; }
    public string? ShopName { get; set; }
    public string? Bio { get; set; }
}
