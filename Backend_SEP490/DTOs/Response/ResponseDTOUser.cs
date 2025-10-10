using Backend_SEP490.Models;

namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOUser
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public DateTime? UpdateAt { get; set; }
        public DateTime? CreateAt { get; set; }
        public string? PhoneNumber { get; set; }
        public string? DisplayName { get; set; }
        public DateTime? Dob { get; set; }
        public string? ShopName { get; set; }
        public string? Bio { get; set; }
        public int? Rating { get; set; }
        public int? AdminLevel { get; set; }
        public List<Address>? Addresses { get; set; }
    }
}
