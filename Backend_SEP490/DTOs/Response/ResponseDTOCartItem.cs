using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOCartItem
    {
        public string Id { get; set; }
        public int? Quantity { get; set; }
        public decimal? PriceAtAdd { get; set; }
        public ResponseDTOProduct? Product { get; set; }
    }
}

