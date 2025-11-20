using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IReportRepository : IGenericRepository<Report>
{
    Task<IEnumerable<Report>> GetReportsByTargetAsync(string targetId);
    Task<Report?> GetDetailsAsync(string reportId);
    Task<(IEnumerable<Report> Items, int TotalCount)> GetPagedReportsAsync(string? status, string? searchTerm, int pageIndex, int pageSize);
    Task<IEnumerable<Report>> GetReportsByReporterAsync(string reporterId);
    Task<IEnumerable<Report>> GetReportsByTargetUserAsync(string targetUserId);
}
