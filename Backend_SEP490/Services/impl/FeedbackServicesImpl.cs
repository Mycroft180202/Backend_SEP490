using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl;

public class FeedbackServicesImpl: GenericServices, IFeedbackServices
{
    public FeedbackServicesImpl(IMapper mapper, IUnitOfWork context) : base(mapper, context)
    {
    }

    public async Task<PagedResult<ResponseDTOFeedback>> GetFeedbacksByProductIdAsync(string productId, int pageIndex, int pageSize)
    {
        var totalCount = await _context.Feedback.CountFeedbacksByProductIdAsync(productId);
        var feedbacks = await _context.Feedback.GetFeedbacksByProductIdAsync(productId, pageIndex, pageSize);

        var rel = _mapper.Map<IEnumerable<ResponseDTOFeedback>>(feedbacks);

        // lấy thêm CustomerName cho từng feedback
        foreach (var fed in rel)
        {
            fed.CustomerName = await _context.Users.GetUserNameByIdAsync(fed.CustomerId);
        }

        return new PagedResult<ResponseDTOFeedback>
        {
            Items = rel,
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
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