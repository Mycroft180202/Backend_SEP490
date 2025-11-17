using System;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestCreateVoucher
    {
        [Required(ErrorMessage = "Mã voucher không được để trống")]
        [StringLength(20, MinimumLength = 4, ErrorMessage = "Mã voucher phải từ 4–20 ký tự")]
        public string Code { get; set; }

        [StringLength(200, ErrorMessage = "Mô tả không được vượt quá 200 ký tự")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Loại giảm giá không được để trống")]
        [RegularExpression("^(Percent|Fixed)$", ErrorMessage = "Loại giảm giá chỉ có thể là 'Percent' hoặc 'Fixed'")]
        public string DiscountType { get; set; } // "Percent" or "Fixed"

        [Required(ErrorMessage = "Giá trị giảm giá không được để trống")]
        [Range(0.01, 1000000, ErrorMessage = "Giá trị giảm giá phải lớn hơn 0")]
        public decimal DiscountValue { get; set; }

        [Range(0, 1000000000, ErrorMessage = "Giá trị đơn hàng tối thiểu không hợp lệ")]
        public decimal? MinOrderAmount { get; set; }

        [Range(0, 1000000000, ErrorMessage = "Giá trị giảm tối đa không hợp lệ")]
        public decimal? MaxDiscountAmount { get; set; }

        [Required(ErrorMessage = "Ngày bắt đầu không được để trống")]
        [DataType(DataType.Date)]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Ngày kết thúc không được để trống")]
        [DataType(DataType.Date)]
        [DateGreaterThan(nameof(StartDate), ErrorMessage = "Ngày kết thúc phải sau ngày bắt đầu")]
        public DateTime EndDate { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Giới hạn sử dụng phải lớn hơn 0")]
        public int? UsageLimit { get; set; }
        public bool IsActive { get; set; } = true;

    }
    public class DateGreaterThanAttribute : ValidationAttribute
    {
        private readonly string _comparisonProperty;

        public DateGreaterThanAttribute(string comparisonProperty)
        {
            _comparisonProperty = comparisonProperty;
        }

        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            var currentValue = (DateTime?)value;
            var property = validationContext.ObjectType.GetProperty(_comparisonProperty);

            if (property == null)
                return new ValidationResult($"Không tìm thấy thuộc tính {_comparisonProperty}");

            var comparisonValue = (DateTime?)property.GetValue(validationContext.ObjectInstance);

            if (currentValue.HasValue && comparisonValue.HasValue && currentValue <= comparisonValue)
                return new ValidationResult(ErrorMessage ?? $"{validationContext.DisplayName} phải sau {_comparisonProperty}");

            return ValidationResult.Success!;
        }
    }
}
