using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestCreateVoucher
    {
        public string Code { get; set; }
        public string? Description { get; set; }
        public string DiscountType { get; set; } // "Percent" or "Fixed"
        public decimal DiscountValue { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? UsageLimit { get; set; }
        public int UsedCount { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public string? CreatedById { get; set; }
    }
}
