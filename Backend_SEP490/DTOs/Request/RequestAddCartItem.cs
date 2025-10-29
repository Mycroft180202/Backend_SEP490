using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestAddCartItem
    {
        [Required(ErrorMessage = "ProductId không được để trống")]
        [StringLength(50, ErrorMessage = "ProductId không được dài quá 50 ký tự")]
        public string ProductId { get; set; }

        [Required(ErrorMessage = "Giá sản phẩm không được để trống")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá phải lớn hơn 0")]
        public decimal PriceAtAdd { get; set; }
    }
}