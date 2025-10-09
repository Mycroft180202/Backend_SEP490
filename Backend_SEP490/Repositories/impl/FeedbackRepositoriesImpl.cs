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
}