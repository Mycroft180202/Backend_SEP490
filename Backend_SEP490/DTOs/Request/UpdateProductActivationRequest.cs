using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class UpdateProductActivationRequest
{
    [Required]
    public bool? IsActive { get; set; }
}
