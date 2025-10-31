using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestUpdateBlogPost
    {
        [Required(ErrorMessage = "Tiêu đề bài viết không được để trống")]
        [StringLength(150, MinimumLength = 5, ErrorMessage = "Tiêu đề phải từ 5–150 ký tự")]
        public string Title { get; set; }

        [Required(ErrorMessage = "Nội dung bài viết không được để trống")]
        [MinLength(20, ErrorMessage = "Nội dung phải có ít nhất 20 ký tự")]
        public string Content { get; set; }

        [Required(ErrorMessage = "Trạng thái bài viết không được để trống")]
        [RegularExpression("^(Draft|Published|Archived)$", ErrorMessage = "Trạng thái chỉ có thể là Draft, Published hoặc Archived")]
        public string PostStatus { get; set; }

        [Url(ErrorMessage = "Đường dẫn hình ảnh không hợp lệ")]
        public string? Image { get; set; }
    }
}