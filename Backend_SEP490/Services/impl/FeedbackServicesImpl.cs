using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl;

public class FeedbackServicesImpl: GenericServices, IFeedbackServices
{
    public FeedbackServicesImpl(IMapper mapper, IUnitOfWork context) : base(mapper, context)
    {
    }

    public async Task<IEnumerable<ResponseDTOFeedback>> GetFeedbacksByProductIdAsync(string productId)
    {
        var feedback = await _context.Feedback.GetFeedbacksByProductIdAsync(productId);
        var rel= _mapper.Map<IEnumerable<ResponseDTOFeedback>>(feedback);
        foreach (var fed in rel)
        {
            var name =  await _context.Users.GetUserNameByIdAsync(fed.CustomerId);
            fed.CustomerName = name;
        }
        return rel;
    }

    public async Task DeleteFeedbacksByIdAsync(string Id)
    {
         await _context.Feedback.DeleteFeedbacksByIdAsync(Id);
    }

    public async Task UpdateFeedbackByIdAsynnc(RequestDTOFeedback feedback, string productID, string userID, string feedbackID)
    {
        await _context.Feedback.UpdateFeedbackByIdAsynnc(feedback, productID, userID, feedbackID);
        
    }

    public async Task CreateFeedback(RequestDTOFeedback feedback, string productID, string userID)
    {
        await _context.Feedback.CreateFeedback(feedback, productID, userID);
    }
}