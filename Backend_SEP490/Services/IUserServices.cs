using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.Services;

public interface IUserServices
{
    public Task<IEnumerable<ResponeseDTOUser>> GetAllUsersAsync();
    public Task<ResponeseDTOUser?> GetUserByArtisanIDAsync(string artisanID);
}