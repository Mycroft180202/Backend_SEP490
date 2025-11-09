using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class FeedbackRepositoriesImpl : GenericRepositoryImpl<Feedback>, IFeedbackRepositories
{
    public FeedbackRepositoriesImpl(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Feedback>> GetFeedbacksByProductIdAsync(string productId)
    {
        var feedback = await _context.Feedbacks.Where(s => s.ProductId == productId).ToListAsync();
        return feedback;
    }

    public async Task<IEnumerable<Feedback>> GetAllFeedbacksAsync()
    {
        var feedbacks = await _context.Feedbacks.ToListAsync();
        return feedbacks;
    }

    public async Task DeleteFeedbacksByIdAsync(string Id)
    {
        var feedbacks = _context.Feedbacks.Where(s => s.Id == Id);
        _context.Feedbacks.RemoveRange(feedbacks);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateFeedbackByIdAsynnc(RequestDTOFeedback feedback,string productID,string feedbackID)
    {
        var feedbacks = await _context.Feedbacks.Where(s=>s.Id == feedbackID).FirstOrDefaultAsync();
        feedbacks.Comment = feedback.Comment;
        feedbacks.Rating = feedback.Rating;
        feedbacks.ProductId = productID;
        
        _context.Feedbacks.Update(feedbacks);
        await _context.SaveChangesAsync();
    }

    public async Task CreateFeedback(RequestDTOFeedback feedback, string productID, string userID)
    {
        var result = new Feedback
        {
            Id = GenerateID("FEB"),
            Comment = feedback.Comment,
            Rating = feedback.Rating,
            CustomerId = userID,
            ProductId = productID,
            CreateAt = DateTime.UtcNow
        };
    _context.Feedbacks.Add(result);
    await _context.SaveChangesAsync();
    }
    public static string GenerateID(string prefix)
    {   
        
        string timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");

        return $"{prefix}-{timestamp}";
    }
    public async Task<int> CountFeedbacksByProductIdAsync(string productId)
    {
        return await _context.Feedbacks
            .Where(f => f.ProductId == productId)
            .CountAsync();
    }

    public async Task<List<Feedback>> GetFeedbacksByProductIdAsync(string productId, int pageIndex, int pageSize)
    {
        return await _context.Feedbacks
            .Where(f => f.ProductId == productId)
            .OrderByDescending(f => f.CreateAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }
}