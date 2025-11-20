using System.Text.Json.Serialization;

namespace Backend_SEP490.DTOs.External.Ghn;

public class GhnCalculateFeeResponse
{
    [JsonPropertyName("code")]
    public int Code { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("data")]
    public GhnFeeData? Data { get; set; }
}

public class GhnFeeData
{
    [JsonPropertyName("total")]
    public int? Total { get; set; }

    [JsonPropertyName("service_fee")]
    public int? ServiceFee { get; set; }

    [JsonPropertyName("insurance_fee")]
    public int? InsuranceFee { get; set; }

    [JsonPropertyName("r2s_fee")]
    public int? R2sFee { get; set; }

    [JsonPropertyName("return_fee")]
    public int? ReturnFee { get; set; }

    [JsonPropertyName("coupon_value")]
    public int? CouponValue { get; set; }

    [JsonPropertyName("pick_station_fee")]
    public int? PickStationFee { get; set; }

    [JsonPropertyName("deliver_station_fee")]
    public int? DeliverStationFee { get; set; }
}
