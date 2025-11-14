using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class RequestCreateOrder
{
    [Required]
    public string ShipingAddressId { get; set; } = default!;

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
    public string? ToProvinceName { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Total weight must be greater than zero")]
    public int TotalWeight { get; set; }

    public List<RequestShipmentItemOverride>? ShipmentItems { get; set; }
}

public class RequestShipmentItemOverride
{
    [Required]
    public string ProductId { get; set; } = default!;

    [Range(1, int.MaxValue)]
    public int? Weight { get; set; }
}
