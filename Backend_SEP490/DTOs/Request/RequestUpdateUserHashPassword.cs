namespace Backend_SEP490.DTOs.Request
{
    public class RequestUpdateUserHashPassword
    {
        public string? OldPassword { get; set; }
        public string? NewPassword { get; set; }
        public string? ConfirmNewPassword { get; set; }
      
    }
}
