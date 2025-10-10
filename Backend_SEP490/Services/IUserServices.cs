using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services;

public interface IUserServices
{
    public Task<IEnumerable<ResponseDTOUser>> GetAllUsersAsync(string? search, bool? status);
    public Task<RequestDTOUser?> GetUserByArtisanIDAsync(string artisanID);
}