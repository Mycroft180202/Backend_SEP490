using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class CalculateShippingFeeRequest
{
    [Range(1, int.MaxValue)]
    public int ToDistrictId { get; set; }

    [Required]
    [StringLength(20)]
    public string ToWardCode { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Weight { get; set; }

    [Range(1, int.MaxValue)]
    public int? Length { get; set; }

    [Range(1, int.MaxValue)]
    public int? Width { get; set; }

    [Range(1, int.MaxValue)]
    public int? Height { get; set; }

    [Range(0, int.MaxValue)]
    public int? InsuranceValue { get; set; }

    [Range(1, int.MaxValue)]
    public int? ServiceId { get; set; }

    [Range(1, int.MaxValue)]
    public int? ServiceTypeId { get; set; }

    public string? CouponCode { get; set; }

    [Range(1, int.MaxValue)]
    public int? FromDistrictId { get; set; }

    [StringLength(20)]
    public string? FromWardCode { get; set; }
}
