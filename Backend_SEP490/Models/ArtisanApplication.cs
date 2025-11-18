using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class ArtisanApplication
{
    [Key]
    public string Id { get; set; }
    public string UserId { get; set; }

    [Required]
    public string FullName { get; set; }
    [Required, EmailAddress]
    public string Email { get; set; }
    [Required, Phone]
    public string PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }

    [Required]
    public string IdentityNumber { get; set; }
    public string? IdentityFrontImagePublicId { get; set; }
    public string? IdentityFrontImageUrl { get; set; }
    public string? IdentityBackImagePublicId { get; set; }
    public string? IdentityBackImageUrl { get; set; }
    public string SkillDescription { get; set; }
    public int? YearsOfExperience { get; set; }
    public string WorkshopAddress { get; set; }
    public string? ShopName { get; set; }
    public string? Bio { get; set; }

    [Required]
    public string Status { get; set; }
    public string? AdminNote { get; set; }
    public string? RejectReason { get; set; }
    public string? ReviewedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    [JsonIgnore]
    public User User { get; set; }
    [JsonIgnore]
    public User? Reviewer { get; set; }
}
