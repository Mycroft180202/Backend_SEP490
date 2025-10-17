using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IFeedbackRepositories
{
    public Task<IEnumerable<Feedback>> GetFeedbacksByProductIdAsync(string productId);
    public Task<IEnumerable<Feedback>> GetAllFeedbacksAsync();
    Task DeleteFeedbacksByIdAsync(string Id);
    Task UpdateFeedbackByIdAsynnc(RequestDTOFeedback feedback,string productID, string userID,string feedbackID);
    Task CreateFeedback(RequestDTOFeedback feedback,string productID, string userID);
}