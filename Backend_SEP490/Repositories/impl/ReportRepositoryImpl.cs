using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class ReportRepositoryImpl : GenericRepositoryImpl<Report>, IReportRepository
{
    public ReportRepositoryImpl(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Report>> GetReportsByTargetAsync(string targetId)
    {
        return await _context.Reports
            .Where(r => r.TargetID == targetId)
            .ToListAsync();
    }
}
