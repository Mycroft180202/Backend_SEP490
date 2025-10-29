using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services;

public interface IUserServices
{
    public Task<PagedResult<ResponseDTOUser>> GetAllUsersAsync(RequestFilterUser requestFilter, int pageIndex, int pageSize);
    public Task<ResponseDTOUser?> GetUserByIDAsync(string userID);
    public Task<string?> UpdateUserAsync(string userID, RequestUpdateUser request);
    public Task<ResponseDTOUser?> GetUserByArtisanIDAsync(string artisanID);

    Task<ResponseDTOAuth?> LoginAsync(string username, string password);
    Task<ResponseDTOAuth?> RefreshTokenAsync(string refreshToken);
    Task<bool> LogoutAsync(string refreshToken);
    Task<bool> RegisterAsync(RequestDTORegister dto);
    Task<bool> VerifyOtpAsync(RequestDTORegister dto, string otp);
    public Task<bool> ForgotPasswordAsync(string email);
    public Task<bool> ResetPasswordAsync(RequestDTOResetPassword dto);
    public Task<string> ChangePasswordAsync(string userId, RequestUpdateUserHashPassword request);
}