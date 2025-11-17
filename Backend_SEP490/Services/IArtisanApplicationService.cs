using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services;

public interface IArtisanApplicationService
{
    Task<(bool Success, string Message, ResponseArtisanApplicationDto? Data)> CreateAsync(string userId, RequestCreateArtisanApplication request);
    Task<ResponseArtisanApplicationDto?> GetMyApplicationAsync(string userId);
    Task<ResponseArtisanApplicationDto?> GetByIdAsync(string id);
    Task<PagedResult<ResponseArtisanApplicationDto>> GetAllAsync(ArtisanApplicationFilterRequest filterRequest);
    Task<(bool Success, string Message)> ReviewAsync(string adminId, string applicationId, ReviewArtisanApplicationRequest request);
}
