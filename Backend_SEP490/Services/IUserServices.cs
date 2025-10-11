using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services;

public interface IUserServices
{
    public Task<IEnumerable<ResponseDTOUser>> GetAllUsersAsync(RequestFilter requestFilter);
    public Task<ResponseDTOUser?> GetUserByIDAsync(string userID);
    public Task<RequestDTOUser?> GetUserByArtisanIDAsync(string artisanID);
}