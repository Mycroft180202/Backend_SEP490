namespace Backend_SEP490.DTOs.Response
{
    public class ResponseDTOUserDashboard
    {
        public string UserID { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public bool IsActive { get; set; }
        public DateTime? UpdateAt { get; set; }
        public DateTime? CreateAt { get; set; }
        public string? PhoneNumber { get; set; }
        public string? DisplayName { get; set; }
        public DateTime? Dob { get; set; }
        public string? UserUrlImage { get; set; }
        public decimal? TotalSpendMoney { get; set; }
        public List<ResponseDTOAddress>? Addresses { get; set; }
        public List<ResponseDTORole>? Roles { get; set; }
    }
}
