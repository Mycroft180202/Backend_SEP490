using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;

namespace Backend_SEP490.Services.impl;

public class FeedbackServicesImpl: GenericServices, IFeedbackServices
{
    private readonly INotificationService _notificationService;

    public FeedbackServicesImpl(IMapper mapper, IUnitOfWork context, INotificationService notificationService) : base(mapper, context)
    {
        _notificationService = notificationService;
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

    public async Task UpdateFeedbackByIdAsynnc(RequestDTOFeedback feedback, string productID, string feedbackID)
    {
        await _context.Feedback.UpdateFeedbackByIdAsynnc(feedback, productID,  feedbackID);
        
    }

    public async Task<bool> CreateFeedback(RequestDTOFeedback feedback, string productID, string userID)
    {
        var canReview = await _context.Order.HasUserPurchasedProductAsync(userID, productID);
        if (!canReview)
        {
            return false;
        }

        await _context.Feedback.CreateFeedback(feedback, productID, userID);

        var product = await _context.Products.GetProductByIdAsync(productID);
        var customer = await _context.Users.GetByIdAsync(userID);

        if (product != null && customer != null)
        {
            await _notificationService.NotifyArtisanFeedbackAsync(product, customer, feedback);
        }

        return true;
    }
}
