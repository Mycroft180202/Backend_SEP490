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

    public async Task<Report?> GetDetailsAsync(string reportId)
    {
        return await _context.Reports
            .Include(r => r.Reporter)
            .Include(r => r.TargetUser)
            .Include(r => r.AssignedAdmin)
            .FirstOrDefaultAsync(r => r.Id == reportId);
    }

    public async Task<(IEnumerable<Report> Items, int TotalCount)> GetPagedReportsAsync(
        string? status,
        string? searchTerm,
        int pageIndex,
        int pageSize)
    {
        var query = _context.Reports
            .Include(r => r.Reporter)
            .Include(r => r.TargetUser)
            .Include(r => r.AssignedAdmin)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.ReportStatus.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var normalized = searchTerm.Trim().ToLower();
            query = query.Where(r =>
                r.Id.ToLower().Contains(normalized) ||
                r.TargetID.ToLower().Contains(normalized) ||
                (r.Reporter.DisplayName != null && r.Reporter.DisplayName.ToLower().Contains(normalized)) ||
                (r.TargetUser != null && r.TargetUser.DisplayName != null && r.TargetUser.DisplayName.ToLower().Contains(normalized)) ||
                (r.Reason != null && r.Reason.ToLower().Contains(normalized)));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<IEnumerable<Report>> GetReportsByReporterAsync(string reporterId)
    {
        return await _context.Reports
            .Where(r => r.ReporterId == reporterId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Report>> GetReportsByTargetUserAsync(string targetUserId)
    {
        return await _context.Reports
            .Where(r => r.TargetUserId == targetUserId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }
}
