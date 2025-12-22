using System;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestUpdateVoucher
    {
        [Required(ErrorMessage = "Mã voucher không được để trống")]
        [StringLength(20, MinimumLength = 3, ErrorMessage = "Mã voucher phải từ 3–20 ký tự")]
        public string Code { get; set; }

        [StringLength(200, ErrorMessage = "Mô tả không được vượt quá 200 ký tự")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Loại giảm giá là bắt buộc")]
        [RegularExpression("^(Percent|Fixed)$", ErrorMessage = "Loại giảm giá chỉ có thể là 'Percent' hoặc 'Fixed'")]
        public string DiscountType { get; set; }

        [Required(ErrorMessage = "Giá trị giảm không được để trống")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá trị giảm phải lớn hơn 0")]
        public decimal DiscountValue { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá trị đơn hàng tối thiểu không hợp lệ")]
        public decimal? MinOrderAmount { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá trị giảm tối đa không hợp lệ")]
        public decimal? MaxDiscountAmount { get; set; }

        [Required(ErrorMessage = "Ngày bắt đầu là bắt buộc")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Ngày kết thúc là bắt buộc")]
        [CustomValidation(typeof(RequestUpdateVoucher), nameof(ValidateEndDate))]
        public DateTime EndDate { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Giới hạn sử dụng phải lớn hơn 0")]
        public int? UsageLimit { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số lượt đã sử dụng không hợp lệ")]
        public int UsedCount { get; set; } = 0;

        public bool IsActive { get; set; } = true;
        public bool IsShared { get; set; } = true;
        public bool SingleUse { get; set; }
        [StringLength(450)]
        public string? OwnerUserId { get; set; }
        [StringLength(100)]
        public string? Source { get; set; }

        // ✅ Custom validation đảm bảo EndDate sau StartDate
        public static ValidationResult? ValidateEndDate(DateTime endDate, ValidationContext context)
        {
            var instance = context.ObjectInstance as RequestUpdateVoucher;
            if (instance != null && endDate <= instance.StartDate)
            {
                return new ValidationResult("Ngày kết thúc phải sau ngày bắt đầu");
            }
            return ValidationResult.Success;
        }
    }
}
