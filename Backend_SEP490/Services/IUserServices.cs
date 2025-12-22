using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services;

public interface IUserServices
{
    public Task<PagedResult<ResponseDTOUser>> GetAllUsersAsync( int pageIndex, int pageSize);
    public Task<PagedResult<ResponseDTOUserDashboard>> GetAllCustomerAsync( int pageIndex, int pageSize);
    public Task<PagedResult<ResponseDTOUserShopDashboard>> GetAllArtisanAsync(int pageIndex, int pageSize, int? year = null, int? month = null);
    public Task<ResponseDTOUser?> GetUserByIDAsync(string userID);
    public Task<string?> UpdateUserAsync(string userID, RequestUpdateUser request);
    public Task<string?> UpdateUserAsync(string userID, RequestAdminUpdateUser request);
    public Task<ResponseDTOUser?> GetUserByArtisanIDAsync(string artisanID);

    Task<ResponseDTOAuth?> LoginAsync(string username, string password);
    Task<ResponseDTOAuth?> RefreshTokenAsync(string refreshToken);
    Task<bool> LogoutAsync(string refreshToken);
    Task<bool> RegisterAsync(RequestDTORegister dto);
    Task<bool> VerifyOtpAsync(RequestDTORegister dto, string otp);
    public Task<bool> ForgotPasswordAsync(string email);
    public Task<bool> ResetPasswordAsync(RequestDTOResetPassword dto);
    public Task<string> ChangePasswordAsync(string userId, RequestUpdateUserHashPassword request);
    public Task<ResponseDTOUserShop?> GetUserShopByIDAsync(string userID);
    public Task<string?> UpdateUserShopByIDAsync(string userID, RequestUpdateUserShop request);
    Task<int> GetNumberOfArtisanAsync();
    Task<int> GetNumberOfUserAsync();
}
