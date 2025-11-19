using System.ComponentModel.DataAnnotations;
using Backend_SEP490.Models;

namespace Backend_SEP490.DTOs.Response;

public class RequestDTOProduct
{
    [Required(ErrorMessage = "Tên sản phẩm không được để trống")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Tên sản phẩm phải từ 3–100 ký tự")]
    public string Name { get; set; }

    [StringLength(200, ErrorMessage = "Mô tả ngắn không được vượt quá 200 ký tự")]
    public string? ShortDescription { get; set; }

    [StringLength(2000, ErrorMessage = "Mô tả chi tiết không được vượt quá 2000 ký tự")]
    public string? LongDescription { get; set; }

    [Required(ErrorMessage = "Giá sản phẩm không được để trống")]
    [Range(0.01, 100000000, ErrorMessage = "Giá sản phẩm phải lớn hơn 0")]
    public decimal Price { get; set; }

    [Required(ErrorMessage = "Danh mục không được để trống")]
    [StringLength(50, ErrorMessage = "Tên danh mục không được vượt quá 50 ký tự")]
    public string Category { get; set; }

    [Required(ErrorMessage = "Mã nghệ nhân không được để trống")]
    [StringLength(50, ErrorMessage = "Mã nghệ nhân không được vượt quá 50 ký tự")]
    public string ArtisanId { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Số lượng tồn kho không hợp lệ")]
    public int Stock { get; set; }

    [MinLength(1, ErrorMessage = "Phải có ít nhất 1 ảnh sản phẩm")]
    public List<IFormFile> Images { get; set; } = new();
}