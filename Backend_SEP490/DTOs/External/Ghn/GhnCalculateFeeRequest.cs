namespace Backend_SEP490.DTOs.External.Ghn;

public class GhnCalculateFeeRequest
{
    public int? FromDistrictId { get; set; }
    public string? FromWardCode { get; set; }
    public int ToDistrictId { get; set; }
    public string ToWardCode { get; set; } = string.Empty;
    public int Weight { get; set; }
    public int? Length { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public int? InsuranceValue { get; set; }
    public int? ServiceId { get; set; }
    public int? ServiceTypeId { get; set; }
    public string? CouponCode { get; set; }
}
