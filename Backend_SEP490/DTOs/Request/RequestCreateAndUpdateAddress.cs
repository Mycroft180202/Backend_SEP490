namespace Backend_SEP490.DTOs.Request
{
    public class RequestCreateAndUpdateAddress
    {
        public string? Line1 { get; set; }
        public string? Line2 { get; set; }
        public string City { get; set; }
        public string? PosttalCode { get; set; }
        public string Country { get; set; }
        public bool IsDefault { get; set; }
    }
}
