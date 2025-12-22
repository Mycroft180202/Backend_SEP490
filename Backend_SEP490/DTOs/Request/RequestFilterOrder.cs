using System.ComponentModel.DataAnnotations;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestFilterOrder
    {
        public string? search { get; set; }
        public string? Status { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "pageIndex must be at least 1.")]
        public int PageIndex { get; set; } = 1;

        [Range(1, 100, ErrorMessage = "pageSize must be between 1 and 100.")]
        public int PageSize { get; set; } = 10;
    }
}
