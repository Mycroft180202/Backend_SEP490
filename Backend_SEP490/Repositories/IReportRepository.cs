using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IReportRepository : IGenericRepository<Report>
{
    Task<IEnumerable<Report>> GetReportsByTargetAsync(string targetId);
}
