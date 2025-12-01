using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;

namespace Backend_SEP490.Services;

public interface IReportService
{
    Task<string> ReportProductAsync(string reporterId, ReportProductRequest request);
    Task<int> NewReportNumberAsync();
    Task<PagedResult<ReportSummaryResponse>> GetReportsForAdminAsync(ReportFilterRequest filter);
    Task<ReportDetailResponse?> GetReportDetailAsync(string reportId, string requesterId, bool isAdmin);
    Task<string> AssignReportAsync(string adminId, string reportId, AssignReportRequest request);
    Task<string> UpdateReportStatusAsync(string adminId, string reportId, UpdateReportStatusRequest request);
    Task<IEnumerable<ReportStatusResponse>> GetReporterStatusesAsync(string reporterId);
    Task<IEnumerable<ReportStatusResponse>> GetAccusedStatusesAsync(string accusedId);
    Task<string> SubmitAppealAsync(string accusedId, string reportId, ReportAppealRequest request);
}
