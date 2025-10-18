namespace Backend_SEP490.DTOs.Request
{
    public class RequestAddCartItem
    {
        public string? ProductId { get; set; }
        public decimal? PriceAtAdd { get; set; }
    }
}
