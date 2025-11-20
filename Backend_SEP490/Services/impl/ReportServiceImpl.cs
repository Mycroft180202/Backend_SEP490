using System.Linq;
using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;

namespace Backend_SEP490.Services.impl;

public class ReportServiceImpl : GenericServices, IReportService
{
    private readonly INotificationService _notificationService;

    public ReportServiceImpl(
        IMapper mapper,
        IUnitOfWork unitOfWork,
        INotificationService notificationService) : base(mapper, unitOfWork)
    {
        _notificationService = notificationService;
    }

    public async Task<string> ReportProductAsync(string reporterId, ReportProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(reporterId))
        {
            return "Reporter is required.";
        }

        var product = await _context.Products.GetProductByIdAsync(request.TargetProductId);
        if (product == null)
        {
            return "Product not found!";
        }

        var reporter = await _context.Users.GetByIdAsync(reporterId);
        if (reporter == null)
        {
            return "Reporter not found!";
        }

        var report = new Report
        {
            Id = $"REP-{Guid.NewGuid():N}",
            ReporterId = reporterId,
            TargetType = "Product",
            TargetID = request.TargetProductId,
            Reason = request.Reason,
            ReportStatus = "Pending",
            CreatedAt = DateTime.UtcNow,
            TargetUserId = product.ArtisanId
        };

        await _context.Reports.AddAsync(report);
        await _context.SaveChangesAsync();

        await _notificationService.NotifyAdminsProductReportedAsync(report, product, reporter);

        return "Report submitted successfully!";
    }

    public async Task<PagedResult<ReportSummaryResponse>> GetReportsForAdminAsync(ReportFilterRequest filter)
    {
        filter ??= new ReportFilterRequest();
        var pageIndex = filter.PageIndex <= 0 ? 1 : filter.PageIndex;
        var pageSize = filter.PageSize <= 0 ? 20 : filter.PageSize;

        var (reports, totalCount) = await _context.Reports.GetPagedReportsAsync(
            filter.Status,
            filter.SearchTerm,
            pageIndex,
            pageSize);

        var lookup = await BuildProductLookupAsync(reports);

        var summaries = reports.Select(report =>
            MapToSummary(report, lookup.TryGetValue(report.TargetID, out var product) ? product.Name : null));

        return new PagedResult<ReportSummaryResponse>
        {
            Items = summaries.ToList(),
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    public async Task<ReportDetailResponse?> GetReportDetailAsync(string reportId, string requesterId, bool isAdmin)
    {
        var report = await _context.Reports.GetDetailsAsync(reportId);
        if (report == null)
        {
            return null;
        }

        var isOwner = !string.IsNullOrWhiteSpace(requesterId) &&
                      (string.Equals(report.ReporterId, requesterId, StringComparison.OrdinalIgnoreCase) ||
                       string.Equals(report.TargetUserId, requesterId, StringComparison.OrdinalIgnoreCase));

        if (!isAdmin && !isOwner)
        {
            return null;
        }

        var product = await _context.Products.GetProductByIdAsync(report.TargetID);

        return new ReportDetailResponse
        {
            ReportId = report.Id,
            TargetType = report.TargetType,
            TargetId = report.TargetID,
            TargetName = product?.Name,
            ReporterId = report.ReporterId,
            ReporterName = report.Reporter?.DisplayName ?? report.Reporter?.Username,
            ReporterEmail = report.Reporter?.Email,
            TargetUserId = report.TargetUserId,
            TargetUserName = report.TargetUser?.DisplayName ?? report.TargetUser?.Username,
            TargetUserEmail = report.TargetUser?.Email,
            AssignedAdminId = report.AssignedAdminId,
            AssignedAdminName = report.AssignedAdmin?.DisplayName ?? report.AssignedAdmin?.Username,
            Reason = report.Reason,
            Status = report.ReportStatus,
            AdminNotes = report.AdminNotes,
            AppealReason = report.AppealReason,
            AppealStatus = report.AppealStatus,
            CreatedAt = report.CreatedAt,
            AssignedAt = report.AssignedAt,
            ResolvedAt = report.ResolvedAt,
            AppealedAt = report.AppealedAt
        };
    }

    public async Task<string> AssignReportAsync(string adminId, string reportId, AssignReportRequest request)
    {
        var report = await _context.Reports.GetDetailsAsync(reportId);
        if (report == null)
        {
            return "Report not found.";
        }

        if (!string.Equals(report.ReportStatus, "Pending", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(report.ReportStatus, "Appealed", StringComparison.OrdinalIgnoreCase))
        {
            return "Report is already being processed.";
        }

        if (!string.IsNullOrWhiteSpace(report.AssignedAdminId) &&
            !string.Equals(report.AssignedAdminId, adminId, StringComparison.OrdinalIgnoreCase))
        {
            return "Report has already been assigned.";
        }

        report.AssignedAdminId = adminId;
        report.AssignedAt = DateTime.UtcNow;
        report.AssignedAdmin ??= await _context.Users.GetByIdAsync(adminId);
        report.ReportStatus = "InReview";
        if (request?.Note != null)
        {
            report.AdminNotes = request.Note;
        }

        await _context.SaveChangesAsync();
        return "Report assigned successfully.";
    }

    public async Task<string> UpdateReportStatusAsync(string adminId, string reportId, UpdateReportStatusRequest request)
    {
        var report = await _context.Reports.GetDetailsAsync(reportId);
        if (report == null)
        {
            return "Report not found.";
        }

        if (IsHandledByAnotherAdmin(report, adminId))
        {
            return "You cannot update a report handled by another administrator.";
        }

        var newStatus = request.NewStatus?.Trim();
        if (string.IsNullOrWhiteSpace(newStatus))
        {
            return "Status is required.";
        }

        report.ReportStatus = newStatus;
        report.AdminNotes = request.AdminNote ?? report.AdminNotes;
        if (newStatus.Equals("Resolved", StringComparison.OrdinalIgnoreCase))
        {
            report.ResolvedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return "Report status updated.";
    }

    public async Task<IEnumerable<ReportStatusResponse>> GetReporterStatusesAsync(string reporterId)
    {
        var reports = await _context.Reports.GetReportsByReporterAsync(reporterId);
        var lookup = await BuildProductLookupAsync(reports);
        return reports.Select(report =>
            MapToStatusResponse(report, lookup.TryGetValue(report.TargetID, out var product) ? product.Name : null));
    }

    public async Task<IEnumerable<ReportStatusResponse>> GetAccusedStatusesAsync(string accusedId)
    {
        var reports = await _context.Reports.GetReportsByTargetUserAsync(accusedId);
        var lookup = await BuildProductLookupAsync(reports);
        return reports.Select(report =>
            MapToStatusResponse(report, lookup.TryGetValue(report.TargetID, out var product) ? product.Name : null));
    }

    public async Task<string> SubmitAppealAsync(string accusedId, string reportId, ReportAppealRequest request)
    {
        var report = await _context.Reports.GetDetailsAsync(reportId);
        if (report == null)
        {
            return "Report not found.";
        }

        if (!string.Equals(report.TargetUserId, accusedId, StringComparison.OrdinalIgnoreCase))
        {
            return "You are not allowed to appeal this report.";
        }

        if (string.Equals(report.ReportStatus, "Resolved", StringComparison.OrdinalIgnoreCase))
        {
            return "This report has already been resolved.";
        }

        report.AppealReason = request.Message;
        report.AppealStatus = "Pending";
        report.AppealedAt = DateTime.UtcNow;
        if (!string.Equals(report.ReportStatus, "InReview", StringComparison.OrdinalIgnoreCase))
        {
            report.ReportStatus = "Appealed";
        }

        await _context.SaveChangesAsync();
        return "Appeal submitted successfully.";
    }

    private static ReportSummaryResponse MapToSummary(Report report, string? targetName)
    {
        return new ReportSummaryResponse
        {
            ReportId = report.Id,
            TargetType = report.TargetType,
            TargetId = report.TargetID,
            TargetName = targetName,
            ReporterId = report.ReporterId,
            ReporterName = report.Reporter?.DisplayName ?? report.Reporter?.Username,
            TargetUserId = report.TargetUserId,
            TargetUserName = report.TargetUser?.DisplayName ?? report.TargetUser?.Username,
            Status = report.ReportStatus,
            AppealStatus = report.AppealStatus,
            AssignedAdminId = report.AssignedAdminId,
            AssignedAdminName = report.AssignedAdmin?.DisplayName ?? report.AssignedAdmin?.Username,
            CreatedAt = report.CreatedAt,
            AssignedAt = report.AssignedAt,
            ResolvedAt = report.ResolvedAt
        };
    }

    private static ReportStatusResponse MapToStatusResponse(Report report, string? targetName)
    {
        var lastUpdated = new[]
        {
            report.AssignedAt,
            report.ResolvedAt,
            report.AppealedAt
        }.Where(d => d.HasValue)
         .Select(d => d!.Value)
         .DefaultIfEmpty(report.CreatedAt)
         .Max();

        return new ReportStatusResponse
        {
            ReportId = report.Id,
            TargetType = report.TargetType,
            TargetId = report.TargetID,
            TargetName = targetName,
            Status = report.ReportStatus,
            AppealStatus = report.AppealStatus,
            AppealReason = report.AppealReason,
            CreatedAt = report.CreatedAt,
            LastUpdatedAt = lastUpdated
        };
    }

    private async Task<Dictionary<string, Product>> BuildProductLookupAsync(IEnumerable<Report> reports)
    {
        var productIds = reports?
            .Where(r => !string.IsNullOrWhiteSpace(r.TargetID))
            .Select(r => r.TargetID)
            .Distinct()
            .ToList() ?? new List<string>();

        if (!productIds.Any())
        {
            return new Dictionary<string, Product>();
        }

        var products = await _context.Products.GetProductsByIdsAsync(productIds);
        return products.ToDictionary(p => p.Id, p => p);
    }

    private static bool IsHandledByAnotherAdmin(Report report, string adminId)
    {
        if (string.IsNullOrWhiteSpace(report.AssignedAdminId))
        {
            return false;
        }

        return !string.Equals(report.AssignedAdminId, adminId, StringComparison.OrdinalIgnoreCase);
    }
}
