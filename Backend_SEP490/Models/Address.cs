using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.Models;

public class Address
{
    [Key]
    public string Id { get; set; }
    public string UserID { get; set; }
    public string? Line1 { get; set; }
    public string? Line2 { get; set; }
    public string City { get; set; }
    public string? PosttalCode { get; set; }
    public string Country { get; set; }
    public bool IsDefault { get; set; }

    public User User { get; set; }
}
