using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.Services;

public interface IUserServices
{
    public Task<IEnumerable<ResponseDTOUser>> GetAllUsersAsync();
    public Task<ResponseDTOUser?> GetUserByArtisanIDAsync(string artisanID);
    Task<string?> LoginAsync(string username, string password);
}