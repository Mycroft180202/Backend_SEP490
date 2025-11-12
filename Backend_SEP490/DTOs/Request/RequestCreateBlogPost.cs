using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestCreateBlogPost
    {
        [Required(ErrorMessage = "Tiêu đề bài viết không được để trống")]
        [StringLength(150, MinimumLength = 5, ErrorMessage = "Tiêu đề phải từ 5–150 ký tự")]
        public string Title { get; set; }

        [Required(ErrorMessage = "Nội dung bài viết không được để trống")]
        [MinLength(20, ErrorMessage = "Nội dung bài viết phải có ít nhất 20 ký tự")]
        public string Content { get; set; }

        [Required(ErrorMessage = "Hình ảnh không được để trống")]
        [Url(ErrorMessage = "Hình ảnh phải là một URL hợp lệ")]
        public IFormFile? Image { get; set; }
    }
}