namespace Backend_SEP490.DTOs.Response;

public class RequestDTORegister
{
    
    public string Username { get; set; }
    public string PasswordHash { get; set; }
    public string Email { get; set; }
    
    
    public string? PhoneNumber { get; set; }
    public string? DisplayName { get; set; }
    public DateTime? Dob { get; set; }
    
}