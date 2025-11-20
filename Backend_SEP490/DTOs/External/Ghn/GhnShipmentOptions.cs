using System.Collections.Generic;

namespace Backend_SEP490.DTOs.External.Ghn;

public class GhnShipmentOptions
{
    public string? ReceiverName { get; set; }
    public string? ReceiverPhone { get; set; }
    public int? ToDistrictId { get; set; }
    public string? ToWardCode { get; set; }
    public string? ToAddress { get; set; }
    public string? ToProvinceName { get; set; }
    public int? Weight { get; set; }
    public int? Length { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public Dictionary<string, int>? ItemWeights { get; set; }
    public string? PaymentType { get; set; }

    public string? FromName { get; set; }
    public string? FromPhone { get; set; }
    public string? FromAddress { get; set; }
    public int? FromDistrictId { get; set; }
    public string? FromWardCode { get; set; }
    public int? ShopIdOverride { get; set; }
    public string? TokenOverride { get; set; }
    public decimal? CodAmount { get; set; }
    public decimal? InsuranceValue { get; set; }
}
