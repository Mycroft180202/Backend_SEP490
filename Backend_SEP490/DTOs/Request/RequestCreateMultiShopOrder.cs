using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class RequestCreateMultiShopOrder
{
    [MinLength(1, ErrorMessage = "At least one shop order is required.")]
    public List<RequestCreateMultiShopOrderGroup>? Orders { get; set; }

    [Required]
    public string AddressId { get; set; } = default!;

    public int? ShippingServiceId { get; set; }

    [Required]
    [RegularExpression("^(COD|VNPAY)$", ErrorMessage = "Payment method must be COD or VNPAY.")]
    public string PaymentMethod { get; set; } = "COD";

    [StringLength(50)]
    public string? VoucherCodeId { get; set; }

    [Required]
    [RegularExpression("^(CHOTHUHANG|CHOXEMHANGKHONGTHU|KHONGCHOXEMHANG)$", ErrorMessage = "RequiredNote is invalid.")]
    public string RequiredNote { get; set; } = "KHONGCHOXEMHANG";

    [Range(1, 2, ErrorMessage = "Payment_type_id must be either 1 (seller) or 2 (buyer).")]
    public int PaymentTypeId { get; set; } = 2;

    [Range(1, int.MaxValue, ErrorMessage = "service_type_id must be greater than zero.")]
    public int? ServiceTypeId { get; set; } = 2;

    [StringLength(50)]
    public string? BankCode { get; set; }
}

public class RequestCreateMultiShopOrderGroup
{
    [MinLength(1, ErrorMessage = "At least one cart item is required.")]
    public List<RequestCreateOrderItem>? CartItems { get; set; }
}

