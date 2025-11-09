namespace Backend_SEP490.DTOs.Request
{
    public class RequestUpdateUserShop
    {
        public string? ShopName { get; set; }
        public string? PhoneNumber { get; set; }
        public IFormFile? ShopURLImage { get; set; }
    }
}
