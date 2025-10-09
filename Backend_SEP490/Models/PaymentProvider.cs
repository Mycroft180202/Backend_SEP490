using Newtonsoft.Json;

namespace Backend_SEP490.Models;

public class PaymentProvider
{
    public string ProviderID { get; set; }
    public string ProviderName { get; set; }
    public string? Description { get; set; }
    [JsonIgnore]
    public ICollection<Payment>? Payments { get; set; }
}
