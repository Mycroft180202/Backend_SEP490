using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services.impl;

public interface IFeedbackServices
{
    Task<PagedResult<ResponseDTOFeedback>> GetFeedbacksByProductIdAsync(string productId, int pageIndex, int pageSize);
    Task DeleteFeedbacksByIdAsync(string Id);
    Task UpdateFeedbackByIdAsynnc(RequestDTOFeedback feedback,string productID, string userID,string feedbackID);
    Task CreateFeedback(RequestDTOFeedback feedback,string productID, string userID);
}