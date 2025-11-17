using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestDTOUpdateProductCollection
    {
        [Required(ErrorMessage = "Mã bộ sưu tập không được để trống")]
        [Range(1, int.MaxValue, ErrorMessage = "Mã bộ sưu tập phải là số dương hợp lệ")]
        public int ProductCollectionId { get; set; }

        [StringLength(100, MinimumLength = 3, ErrorMessage = "Tiêu đề phải từ 3–100 ký tự")]
        public string? Title { get; set; }

        [StringLength(150, ErrorMessage = "Tiêu đề phụ (headline) không được vượt quá 150 ký tự")]
        public string? Headline { get; set; }

        [StringLength(1000, ErrorMessage = "Nội dung mô tả không được vượt quá 1000 ký tự")]
        public string? Content { get; set; }
        public IFormFile? Image { get; set; }

        [MinLength(1, ErrorMessage = "Phải có ít nhất 1 sản phẩm trong bộ sưu tập")]
        public List<string> ProductIds { get; set; } = new List<string>();
    }
}