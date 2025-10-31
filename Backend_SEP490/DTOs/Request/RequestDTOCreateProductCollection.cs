using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestDTOCreateProductCollection
    {
        [Required(ErrorMessage = "Tiêu đề bộ sưu tập không được để trống")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Tiêu đề phải từ 3–100 ký tự")]
        public string Title { get; set; }

        [StringLength(150, ErrorMessage = "Tiêu đề phụ (headline) không được vượt quá 150 ký tự")]
        public string? Headline { get; set; }

        [StringLength(1000, ErrorMessage = "Nội dung mô tả không được vượt quá 1000 ký tự")]
        public string? Content { get; set; }

        [FileExtensions(Extensions = "jpg,jpeg,png,webp", ErrorMessage = "Chỉ chấp nhận file ảnh có định dạng jpg, jpeg, png hoặc webp")]
        public IFormFile? ImageFile { get; set; }

        [MinLength(1, ErrorMessage = "Phải chọn ít nhất 1 sản phẩm trong bộ sưu tập")]
        public List<string>? ProductIds { get; set; }

        [StringLength(50, ErrorMessage = "Mã người tạo không được vượt quá 50 ký tự")]
        public string? CreatedById { get; set; }
    }
}