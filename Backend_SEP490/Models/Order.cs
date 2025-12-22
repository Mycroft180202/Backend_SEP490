using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Backend_SEP490.Models;
public class Order
{
    [Key]
    public string Id { get; set; }
    public string OrderNumber { get; set; }
    public string CustomerId { get; set; }
    public string Status { get; set; }
    [Required]
    [StringLength(20)]
    public string PaymentType { get; set; } = "COD";
    public decimal TotalAmount { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal? ShippingProviderFee { get; set; }
    public string ShipingAddressId { get; set; }
    public int ShippingServiceId { get; set; }
    public int ShippingServiceTypeId { get; set; } = 2;
    public int ShippingPaymentTypeId { get; set; } = 2;
    public string ShippingRequiredNote { get; set; } = "KHONGCHOXEMHANG";
    public int? ShippingToProvinceId { get; set; }
    public int? ShippingToDistrictId { get; set; }
    public string? ShippingToWardCode { get; set; }
    public string? VoucherCode { get; set; }
    public int? VoucherId { get; set; }
    public DateTime? ExpectedDelivery { get; set; }
    public DateTime CreateAt { get; set; }
    public DateTime? ArtisanConfirmedAt { get; set; }
    public bool IsInventoryReserved { get; set; }
    [JsonIgnore]
    public User Customer { get; set; }
    public ICollection<OrderItem>? OrderItems { get; set; }
    public ICollection<Payment>? Payments { get; set; }
    public ICollection<Shipment>? Shipments { get; set; }
}
