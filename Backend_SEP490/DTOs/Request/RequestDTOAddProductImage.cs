using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class RequestDTOAddProductImage
{
    [Required(ErrorMessage = "ProductId is required")]
    public string ProductId { get; set; }

    [Required(ErrorMessage = "Image file is required")]
    public List<IFormFile> ImageFile { get; set; }
}