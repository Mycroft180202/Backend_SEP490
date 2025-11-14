using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class SellerShippingProfile
{
    [Key]
    public string Id { get; set; } = default!;

    public string SellerId { get; set; } = default!;

    public string? PickupContactName { get; set; }

    public string? PickupContactPhone { get; set; }

    public string? PickupAddressLine { get; set; }

    public string? PickupProvinceName { get; set; }

    public int? PickupDistrictId { get; set; }

    public string? PickupWardCode { get; set; }

    public string? GhnToken { get; set; }

    public int? GhnShopId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public User Seller { get; set; } = default!;
}
