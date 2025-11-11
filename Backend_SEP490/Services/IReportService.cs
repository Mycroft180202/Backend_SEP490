using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.Services;

public interface IReportService
{
    Task<string> ReportProductAsync(string reporterId, ReportProductRequest request);
}
