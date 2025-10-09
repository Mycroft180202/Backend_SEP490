using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.Services;

public interface IUserServices
{
    public Task<IEnumerable<RequestDTOUser>> GetAllUsersAsync();
    public Task<RequestDTOUser?> GetUserByArtisanIDAsync(string artisanID);
}