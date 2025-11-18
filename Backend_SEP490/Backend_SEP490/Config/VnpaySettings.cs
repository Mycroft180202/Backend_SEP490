namespace Backend_SEP490.Config;

public class VnpaySettings
{
    public string TmnCode { get; set; } = string.Empty;
    public string HashSecret { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;
    public string ReturnUrl { get; set; } = string.Empty;
    public string QueryDrUrl { get; set; } = string.Empty;
    public string Version { get; set; } = "2.1.0";
    public string Locale { get; set; } = "vn";
    public string CurrencyCode { get; set; } = "VND";
    public string Command { get; set; } = "pay";
    public string DefaultBankCode { get; set; } = "VNPAYQR";
    public int ExpireMinutes { get; set; } = 15;
}
