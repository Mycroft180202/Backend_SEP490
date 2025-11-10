using Backend_SEP490.Data;

namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOOrder
    {
        public string OrderNumber { get; set; }
        public string CustomerId { get; set; }
        public string Status { get; set; }
        public decimal TotalAmount { get; set; }
        public string ShipingAddressId { get; set; }
        public DateTime CreateAt { get; set; }
        public PagedResult<ResponseDTOOrderItem> Items { get; set; }
    }
}
