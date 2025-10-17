using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services;

public interface IUserServices
{
    public Task<IEnumerable<ResponseDTOUser>> GetAllUsersAsync();
    public Task<ResponseDTOUser?> GetUserByArtisanIDAsync(string artisanID);
    Task<ResponseDTOAuth?> LoginAsync(string username, string password);
    Task<ResponseDTOAuth?> RefreshTokenAsync(string refreshToken);
    Task<bool> LogoutAsync(string refreshToken);
    Task<bool> RegisterAsync(RequestDTORegister dto);
    Task<bool> VerifyOtpAsync(RequestDTORegister dto, string otp);
    public Task<bool> ForgotPasswordAsync(string email);
    public Task<bool> ResetPasswordAsync(RequestDTOResetPassword dto);
}