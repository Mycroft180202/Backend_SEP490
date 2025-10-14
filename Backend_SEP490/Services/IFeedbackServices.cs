using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.Services.impl;

public interface IFeedbackServices
{
    public Task<IEnumerable<ResponeseDTOFeedback>> GetFeedbacksByProductIdAsync(string productId);
}