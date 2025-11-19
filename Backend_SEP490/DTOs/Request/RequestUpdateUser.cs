using System;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestUpdateUser
    {
        [Required(ErrorMessage = "Trạng thái hoạt động là bắt buộc")]
        public bool IsActive { get; set; }

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(15, ErrorMessage = "Số điện thoại không được vượt quá 15 ký tự")]
        public string? PhoneNumber { get; set; }

        [StringLength(50, MinimumLength = 3, ErrorMessage = "Tên hiển thị phải từ 3–50 ký tự")]
        public string? DisplayName { get; set; }

        [DataType(DataType.Date)]
        [CustomValidation(typeof(RequestUpdateUser), nameof(ValidateDob))]
        public DateTime? Dob { get; set; }

        [Required(ErrorMessage = "Vai trò của người dùng là bắt buộc")]
        public string? RolesId { get; set; }

        [Url(ErrorMessage = "Đường dẫn hình ảnh không hợp lệ")]
        public string? UserUrlImage { get; set; }

        public static ValidationResult? ValidateDob(DateTime? dob, ValidationContext context)
        {
            if (dob.HasValue && dob.Value > DateTime.Now)
            {
                return new ValidationResult("Ngày sinh không được lớn hơn ngày hiện tại");
            }
            return ValidationResult.Success;
        }
    }
}