namespace Backend_SEP490.Config;

public class GhnSettings
{
    public string BaseUrl { get; set; } = "https://dev-online-gateway.ghn.vn";
    public string Token { get; set; } = string.Empty;
    public int ShopId { get; set; }

    public string FromName { get; set; } = "Test Warehouse";
    public string FromPhone { get; set; } = "0000000000";
    public string FromAddress { get; set; } = "GHN Test Address";
    public int FromDistrictId { get; set; }
    public string FromWardCode { get; set; } = string.Empty;

    public string? FallbackReceiverPhone { get; set; }
    public int DefaultToDistrictId { get; set; }
    public string DefaultToWardCode { get; set; } = string.Empty;

    public int PaymentTypeId { get; set; } = 2;
    public int? ServiceId { get; set; }
    public int ServiceTypeId { get; set; } = 2;
    public string RequiredNote { get; set; } = "KHONGCHOXEMHANG";

    public int DefaultItemWeight { get; set; } = 500; // grams per item
    public int DefaultParcelLength { get; set; } = 20; // cm
    public int DefaultParcelWidth { get; set; } = 20;  // cm
    public int DefaultParcelHeight { get; set; } = 10; // cm
}
