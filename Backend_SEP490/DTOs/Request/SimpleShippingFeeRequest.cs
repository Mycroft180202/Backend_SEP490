using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class SimpleShippingFeeRequest
{
    [Range(1, int.MaxValue)]
    public int ToDistrictId { get; set; }

    [Required]
    [StringLength(20)]
    public string ToWardCode { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int? ServiceId { get; set; }

    [Range(1, int.MaxValue)]
    public int? ServiceTypeId { get; set; }
}
