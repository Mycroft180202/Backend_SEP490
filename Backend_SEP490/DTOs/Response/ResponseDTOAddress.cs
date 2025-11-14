namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOAddress
    {
        public string? Line1 { get; set; }
        public string? Line2 { get; set; }
        public string City { get; set; }
        public string? PosttalCode { get; set; }
        public string Country { get; set; }
        public bool IsDefault { get; set; }
        public string? ContactName { get; set; }
        public string? ContactPhone { get; set; }
        public int? GhnProvinceId { get; set; }
        public int? GhnDistrictId { get; set; }
        public string? GhnWardCode { get; set; }
    }
}
