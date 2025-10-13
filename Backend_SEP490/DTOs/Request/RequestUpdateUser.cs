using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.DTOs.Request
{
    public class RequestUpdateUser
    {
        public bool IsActive { get; set; }
        public string? PhoneNumber { get; set; }
        public string? DisplayName { get; set; }
        public DateTime? Dob { get; set; }
        public string? ShopName { get; set; }
        
    }
}
