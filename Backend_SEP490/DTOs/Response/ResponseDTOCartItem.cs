using Backend_SEP490.Models;

namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOCartItem
    {
        public int? Quantity { get; set; }
        public decimal? PriceAtAdd { get; set; }
        public RequestDTOProduct? Product { get; set; }
    }
}

