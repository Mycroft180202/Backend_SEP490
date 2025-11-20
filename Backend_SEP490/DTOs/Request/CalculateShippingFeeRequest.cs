using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class CalculateShippingFeeRequest
{
    [Range(1, int.MaxValue)]
    public int ToDistrictId { get; set; }

    [Required]
    [StringLength(20)]
    public string ToWardCode { get; set; } = string.Empty;
}
