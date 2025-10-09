using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IFeedbackRepositories
{
    public Task<IEnumerable<Feedback>> GetFeedbacksByProductIdAsync(string productId);
    public Task<IEnumerable<Feedback>> GetAllFeedbacksAsync();

}