namespace Backend_SEP490.DTOs.Request
{
    public class RequestDTOResetPassword
    {
        public string Email { get; set; }
        public string OtpCode { get; set; }
        public string NewPassword { get; set; }
    }
}