namespace Backend_SEP490.DTOs.Response;

public class SellerShippingProfileDto
{
    public string SellerId { get; set; } = default!;
    public string? PickupContactName { get; set; }
    public string? PickupContactPhone { get; set; }
    public string? PickupAddressLine { get; set; }
    public string? PickupProvinceName { get; set; }
    public int? PickupDistrictId { get; set; }
    public string? PickupWardCode { get; set; }
    public string? GhnToken { get; set; }
    public int? GhnShopId { get; set; }
    public bool IsActive { get; set; }
    public DateTime UpdatedAt { get; set; }
}
