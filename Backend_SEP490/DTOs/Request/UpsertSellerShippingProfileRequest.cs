using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class UpsertSellerShippingProfileRequest
{
    [StringLength(100)]
    public string? PickupContactName { get; set; }

    [Phone]
    public string? PickupContactPhone { get; set; }

    [StringLength(200)]
    public string? PickupAddressLine { get; set; }

    [StringLength(100)]
    public string? PickupProvinceName { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Pickup district must be greater than zero")]
    public int? PickupDistrictId { get; set; }

    public string? PickupWardCode { get; set; }

    public string? GhnToken { get; set; }

    public int? GhnShopId { get; set; }

    public bool IsActive { get; set; } = true;
}
