using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl;

public class FeedbackServicesImpl: GenericServices, IFeedbackServices
{
    public FeedbackServicesImpl(IMapper mapper, IUnitOfWork context) : base(mapper, context)
    {
    }

    public async Task<IEnumerable<RequestDTOFeedback>> GetFeedbacksByProductIdAsync(string productId)
    {
        var feedback = await _context.Feedback.GetFeedbacksByProductIdAsync(productId);
        return _mapper.Map<IEnumerable<RequestDTOFeedback>>(feedback);
    }
}