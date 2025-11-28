using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IStoryTellingRepositories
    {
        public Task<List<StoryTelling>> GetAllStoryTellingByProductIdAsync(string productId);
        public Task<StoryTelling> GetStoryTellingByIdAsync(int storyTellingId);
        public Task<string> CreateStoryTellingAsync(StoryTelling storyTelling);
        public Task<string> UpdateStoryTellingAsync(StoryTelling storyTelling, RequestUpdateStoryTelling request, string ImageURL);
        public Task<string> DeleteStoryTellingAsync(StoryTelling storyTelling);
    }
}
