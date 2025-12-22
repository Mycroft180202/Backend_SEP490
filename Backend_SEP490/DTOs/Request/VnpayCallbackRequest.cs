using System.Text.Json.Serialization;

namespace Backend_SEP490.DTOs.Request;

public class VnpayCallbackRequest
{
    [JsonPropertyName("vnp_Amount")]
    public string? Amount { get; set; }

    [JsonPropertyName("vnp_BankCode")]
    public string? BankCode { get; set; }

    [JsonPropertyName("vnp_BankTranNo")]
    public string? BankTranNo { get; set; }

    [JsonPropertyName("vnp_CardType")]
    public string? CardType { get; set; }

    [JsonPropertyName("vnp_OrderInfo")]
    public string? OrderInfo { get; set; }

    [JsonPropertyName("vnp_PayDate")]
    public string? PayDate { get; set; }

    [JsonPropertyName("vnp_ResponseCode")]
    public string? ResponseCode { get; set; }

    [JsonPropertyName("vnp_TmnCode")]
    public string? TmnCode { get; set; }

    [JsonPropertyName("vnp_TransactionNo")]
    public string? TransactionNo { get; set; }

    [JsonPropertyName("vnp_TransactionStatus")]
    public string? TransactionStatus { get; set; }

    [JsonPropertyName("vnp_TxnRef")]
    public string? TxnRef { get; set; }

    [JsonPropertyName("vnp_SecureHash")]
    public string? SecureHash { get; set; }

    [JsonPropertyName("vnp_SecureHashType")]
    public string? SecureHashType { get; set; }
}
