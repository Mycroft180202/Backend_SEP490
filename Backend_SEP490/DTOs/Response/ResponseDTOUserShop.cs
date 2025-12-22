namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOUserShop
    {
        public string UserID { get; set; }
        public string? ShopName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? DisplayName { get; set; }
        public string? Bio { get; set; }
        public int? Rating { get; set; }
        public string? ShopUrlImage { get; set; }
        public List<ResponseDTOAddress>? Addresses { get; set; }
    }
}
