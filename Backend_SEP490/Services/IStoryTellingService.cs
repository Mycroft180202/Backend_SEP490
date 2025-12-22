using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services
{
    public interface IStoryTellingService
    {
        public Task<List<ResponseDTOStoryTelling>> GetAllStoryTellingByProductIdAsync(string productId);
        public Task<ResponseDTOStoryTelling> GetStoryTellingByIdAsync(int storyTellingId);
        public Task<string> CreateStoryTellingAsync(string userId, RequestCreateStoryTelling request);
        public Task<string> UpdateStoryTellingAsync(int storyTellingId, RequestUpdateStoryTelling request);
        public Task<string> DeleteStoryTellingAsync(int storyTellingId);
    }
}
