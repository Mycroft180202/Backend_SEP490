using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Response
{
    public class RequestDTOVerifyOtp
    {
        [Required(ErrorMessage = "Thông tin đăng ký không được để trống")]
        public RequestDTORegister RegisterDto { get; set; }

        [Required(ErrorMessage = "Mã OTP không được để trống")]
        [StringLength(6, MinimumLength = 4, ErrorMessage = "Mã OTP phải có từ 4–6 ký tự")]
        public string Otp { get; set; }
    }
}