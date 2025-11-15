using System.Text.Json.Serialization;

namespace Backend_SEP490.DTOs.External.Ghn;

public class GhnProvince
{
    [JsonPropertyName("ProvinceID")]
    public int ProvinceId { get; set; }

    [JsonPropertyName("ProvinceName")]
    public string ProvinceName { get; set; } = string.Empty;

    [JsonPropertyName("Code")]
    public string? Code { get; set; }
}

public class GhnDistrict
{
    [JsonPropertyName("DistrictID")]
    public int DistrictId { get; set; }

    [JsonPropertyName("DistrictName")]
    public string DistrictName { get; set; } = string.Empty;

    [JsonPropertyName("ProvinceID")]
    public int ProvinceId { get; set; }
}

public class GhnWard
{
    [JsonPropertyName("WardCode")]
    public string WardCode { get; set; } = string.Empty;

    [JsonPropertyName("WardName")]
    public string WardName { get; set; } = string.Empty;

    [JsonPropertyName("DistrictID")]
    public int DistrictId { get; set; }
}

public class GhnMasterDataResponse<T>
{
    [JsonPropertyName("code")]
    public int Code { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("data")]
    public List<T>? Data { get; set; }
}
