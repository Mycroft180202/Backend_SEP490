using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.Services;

public interface IUserServices
{
    public Task<IEnumerable<ResponseDTOUser>> GetAllUsersAsync();
    public Task<ResponseDTOUser?> GetUserByArtisanIDAsync(string artisanID);
    Task<ResponseDTOAuth?> LoginAsync(string username, string password);
    Task<ResponseDTOAuth?> RefreshTokenAsync(string refreshToken);
    Task<bool> LogoutAsync(string refreshToken);
}