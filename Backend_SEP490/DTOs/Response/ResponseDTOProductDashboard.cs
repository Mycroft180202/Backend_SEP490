using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOProductDashboard
    {
        public ResponseDTOProduct Product { get; set; }
        public int? TotalSold { get; set; }
        public decimal? TotalAmmount { get; set; }

    }
}
