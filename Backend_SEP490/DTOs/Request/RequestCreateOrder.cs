using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class RequestCreateOrder
{
    [Required]
    [RegularExpression("^(COD|VNPAY)$", ErrorMessage = "Payment type must be COD or VNPAY.")]
    public string PaymentType { get; set; } = "COD";

    [Required]
    [StringLength(100)]
    public string ReceiverName { get; set; } = default!;

    [Required]
    [Phone]
    public string ReceiverPhone { get; set; } = default!;

    [Range(1, int.MaxValue, ErrorMessage = "DistrictId must be greater than zero")]
    public int ToDistrictId { get; set; }

    [Required]
    public string ToWardCode { get; set; } = default!;

    [Required]
    [StringLength(150)]
    public string ToAddress { get; set; } = default!;

    [StringLength(100)]
    public string? FromProvinceName { get; set; }

    public List<RequestShipmentItemOverride>? ShipmentItems { get; set; }
}

public class RequestShipmentItemOverride
{
    [Required]
    public string ProductId { get; set; } = default!;
}
