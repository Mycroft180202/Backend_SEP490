using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestCreateAndUpdateAddress
    {
        [Required(ErrorMessage = "Địa chỉ dòng 1 không được để trống")]
        [StringLength(100, ErrorMessage = "Địa chỉ dòng 1 không được vượt quá 100 ký tự")]
        public string Line1 { get; set; }

        [StringLength(100, ErrorMessage = "Địa chỉ dòng 2 không được vượt quá 100 ký tự")]
        public string? Line2 { get; set; }

        [Required(ErrorMessage = "Thành phố không được để trống")]
        [StringLength(50, ErrorMessage = "Tên thành phố không được vượt quá 50 ký tự")]
        public string City { get; set; }

        [RegularExpression(@"^\d{4,10}$", ErrorMessage = "Mã bưu điện phải là số và có từ 4–10 ký tự")]
        public string? PosttalCode { get; set; }

        [Required(ErrorMessage = "Quốc gia không được để trống")]
        [StringLength(50, ErrorMessage = "Tên quốc gia không được vượt quá 50 ký tự")]
        public string Country { get; set; }

        public bool IsDefault { get; set; }

        [StringLength(100, ErrorMessage = "Tên người liên hệ tối đa 100 ký tự")]
        public string? ContactName { get; set; }

        [Phone(ErrorMessage = "Số điện thoại không hợp lệ")]
        public string? ContactPhone { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Mã tỉnh/thành GHN phải lớn hơn 0")]
        public int? GhnProvinceId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Mã quận/huyện GHN phải lớn hơn 0")]
        public int? GhnDistrictId { get; set; }

        public string? GhnWardCode { get; set; }
    }
} 
