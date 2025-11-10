using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IFeedbackRepositories
{
    public Task<IEnumerable<Feedback>> GetFeedbacksByProductIdAsync(string productId);
    public Task<IEnumerable<Feedback>> GetAllFeedbacksAsync();
    Task DeleteFeedbacksByIdAsync(string Id);
    Task UpdateFeedbackByIdAsynnc(RequestDTOFeedback feedback,string productID,string feedbackID);
    Task CreateFeedback(RequestDTOFeedback feedback,string productID, string userID);
    Task<int> CountFeedbacksByProductIdAsync(string productId);
    Task<List<Feedback>> GetFeedbacksByProductIdAsync(string productId, int pageIndex, int pageSize);
    Task<List<Feedback>> GetFeedbacksByProductIdsAsync(IEnumerable<string> productIds);

}