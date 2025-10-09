using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.Services.impl;

public interface IFeedbackServices
{
    public Task<IEnumerable<RequestDTOFeedback>> GetFeedbacksByProductIdAsync(string productId);
}