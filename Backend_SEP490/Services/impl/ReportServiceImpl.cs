using AutoMapper;
using Backend_SEP490.DTOs.Request;
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
            CreatedAt = DateTime.UtcNow
        };

        await _context.Reports.AddAsync(report);
        await _context.SaveChangesAsync();

        await _notificationService.NotifyAdminsProductReportedAsync(report, product, reporter);

        return "Report submitted successfully!";
    }
}
