using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Backend_SEP490.Services.impl;
using Microsoft.Extensions.Logging;
using Moq;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace Backend_SEP490.UnitTests
{
    public class ReportServiceUnitTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<INotificationService> _notificationMock;
        private readonly Mock<ILogger<ReportServiceImpl>> _loggerMock;

        private readonly ReportServiceImpl _service;

        public ReportServiceUnitTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();
            _notificationMock = new Mock<INotificationService>();
            _loggerMock = new Mock<ILogger<ReportServiceImpl>>();

            // Quan trọng: Setup các extension method mà service dùng trực tiếp qua _context
            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync(It.IsAny<string>()))
                .ReturnsAsync((string id) => new Product { Id = id, Name = "Test Product", ArtisanId = "ART001" });

            _unitOfWorkMock.Setup(u => u.Users.GetByIdAsync(It.IsAny<string>()))
                .ReturnsAsync((string id) => new User { UserID = id, DisplayName = "User " + id });

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            _service = new ReportServiceImpl(
                _mapperMock.Object,
                _unitOfWorkMock.Object,
                _notificationMock.Object);
        }

        // ==================================================================
        // REPORT PRODUCT TESTS
        // ==================================================================

        [Fact(DisplayName = "ReportProductAsync - Empty reporterId returns error message")]
        public async Task ReportProductAsync_EmptyReporterId_ReturnsError()
        {
            var result = await _service.ReportProductAsync("", new ReportProductRequest
            {
                TargetProductId = "P1",
                Reason = "Fake"
            });

            Assert.Equal("Reporter is required.", result);
        }

        [Fact(DisplayName = "ReportProductAsync - Product not found returns error")]
        public async Task ReportProductAsync_ProductNotFound_ReturnsError()
        {
            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync("P999"))
                .ReturnsAsync((Product?)null);

            var result = await _service.ReportProductAsync("U1", new ReportProductRequest
            {
                TargetProductId = "P999",
                Reason = "Spam"
            });

            Assert.Equal("Product not found!", result);
        }

        [Fact(DisplayName = "ReportProductAsync - Reporter not found returns error")]
        public async Task ReportProductAsync_ReporterNotFound_ReturnsError()
        {
            _unitOfWorkMock.Setup(u => u.Users.GetByIdAsync("U999"))
                .ReturnsAsync((User?)null);

            var result = await _service.ReportProductAsync("U999", new ReportProductRequest
            {
                TargetProductId = "P1",
                Reason = "Bad"
            });

            Assert.Equal("Reporter not found!", result);
        }

        [Fact(DisplayName = "ReportProductAsync - Valid request creates report and notifies admins")]
        public async Task ReportProductAsync_ValidRequest_Success()
        {
            var reporter = new User { UserID = "U1", DisplayName = "John", Email = "john@x.com" };
            var product = new Product { Id = "P1", Name = "Beautiful Vase", ArtisanId = "A1" };

            _unitOfWorkMock.Setup(u => u.Users.GetByIdAsync("U1")).ReturnsAsync(reporter);
            _unitOfWorkMock.Setup(u => u.Products.GetProductByIdAsync("P1")).ReturnsAsync(product);

            Report? capturedReport = null;
            _unitOfWorkMock.Setup(u => u.Reports.AddAsync(It.IsAny<Report>()))
                .Callback<Report>(r => capturedReport = r);

            var result = await _service.ReportProductAsync("U1", new ReportProductRequest
            {
                TargetProductId = "P1",
                Reason = "This is a fake product"
            });

            Assert.Equal("Report submitted successfully!", result);
            Assert.NotNull(capturedReport);
            Assert.StartsWith("REP-", capturedReport.Id);
            Assert.Equal("U1", capturedReport.ReporterId);
            Assert.Equal("P1", capturedReport.TargetID);
            Assert.Equal("Product", capturedReport.TargetType);
            Assert.Equal("A1", capturedReport.TargetUserId);
            Assert.Equal("Pending", capturedReport.ReportStatus);
            Assert.Equal("This is a fake product", capturedReport.Reason);

            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _notificationMock.Verify(n => n.NotifyAdminsProductReportedAsync(
                capturedReport, product, reporter), Times.Once);
        }

        // ==================================================================
        // ASSIGN REPORT TESTS
        // ==================================================================

        [Fact(DisplayName = "AssignReportAsync - Report not found returns error")]
        public async Task AssignReportAsync_ReportNotFound_ReturnsError()
        {
            _unitOfWorkMock.Setup(u => u.Reports.GetDetailsAsync("REP-999"))
                .ReturnsAsync((Report?)null);

            var result = await _service.AssignReportAsync("ADMIN1", "REP-999", new AssignReportRequest());

            Assert.Equal("Report not found.", result);
        }

        [Fact(DisplayName = "AssignReportAsync - Already assigned by other admin returns error")]
        public async Task AssignReportAsync_AlreadyAssignedByOther_ReturnsError()
        {
            var report = new Report { Id = "REP-1", ReportStatus = "Pending", AssignedAdminId = "ADMIN999" };
            _unitOfWorkMock.Setup(u => u.Reports.GetDetailsAsync("REP-1")).ReturnsAsync(report);

            var result = await _service.AssignReportAsync("ADMIN123", "REP-1", new AssignReportRequest());

            Assert.Equal("Report has already been assigned.", result);
        }

        [Fact(DisplayName = "AssignReportAsync - Valid assignment succeeds")]
        public async Task AssignReportAsync_ValidAssignment_Success()
        {
            var report = new Report { Id = "REP-1", ReportStatus = "Pending", AssignedAdminId = null };
            var admin = new User { UserID = "ADMIN123" };

            _unitOfWorkMock.Setup(u => u.Reports.GetDetailsAsync("REP-1")).ReturnsAsync(report);
            _unitOfWorkMock.Setup(u => u.Users.GetByIdAsync("ADMIN123")).ReturnsAsync(admin);

            var result = await _service.AssignReportAsync("ADMIN123", "REP-1", new AssignReportRequest { Note = "Will review" });

            Assert.Equal("Report assigned successfully.", result);
            Assert.Equal("ADMIN123", report.AssignedAdminId);
            Assert.Equal("InReview", report.ReportStatus);
            Assert.Equal("Will review", report.AdminNotes);
            Assert.NotNull(report.AssignedAt);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
    }
}