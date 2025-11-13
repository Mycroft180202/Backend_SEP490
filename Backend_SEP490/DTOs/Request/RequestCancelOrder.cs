using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request;

public class RequestCancelOrder
{
    [StringLength(250)]
    public string? Reason { get; set; }
}
