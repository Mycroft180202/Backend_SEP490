using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class Payment
{
    [Key]
    public string Id { get; set; }
    public string OrderID { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; }
    public string? ProviderXlnd { get; set; }
    public string PaymentStatus { get; set; }
    public DateTime ProccessedAt { get; set; }
    [JsonIgnore]
    public Order Order { get; set; }
}
