using System;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Response
{
    public class RequestDTORegister
    {
        [Required(ErrorMessage = "Tên đăng nhập không được để trống")]
        [StringLength(30, MinimumLength = 3, ErrorMessage = "Tên đăng nhập phải từ 3–30 ký tự")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Mật khẩu không được để trống")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
        public string PasswordHash { get; set; }

        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; }

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        [StringLength(15, ErrorMessage = "Số điện thoại không được dài quá 15 ký tự")]
        public string? PhoneNumber { get; set; }

        [StringLength(50, ErrorMessage = "Tên hiển thị không được dài quá 50 ký tự")]
        public string? DisplayName { get; set; }

        [DataType(DataType.Date)]
        [CustomValidation(typeof(RequestDTORegister), nameof(ValidateDob))]
        public DateTime? Dob { get; set; }

        // ✅ Hàm custom validation cho ngày sinh
        public static ValidationResult? ValidateDob(DateTime? dob, ValidationContext context)
        {
            if (dob == null) return ValidationResult.Success;

            if (dob > DateTime.Now)
                return new ValidationResult("Ngày sinh không thể ở tương lai");

            if (dob < DateTime.Now.AddYears(-120))
                return new ValidationResult("Ngày sinh không hợp lệ");

            return ValidationResult.Success;
        }
    }
}