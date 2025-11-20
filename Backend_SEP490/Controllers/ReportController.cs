using System;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetReports([FromQuery] ReportFilterRequest? filter)
    {
        var result = await _reportService.GetReportsForAdminAsync(filter ?? new ReportFilterRequest());
        return Ok(result);
    }

    [HttpPost("product")]
    public async Task<IActionResult> ReportProduct([FromBody] ReportProductRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await _reportService.ReportProductAsync(userId, request);
        if (!result.Contains("success", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpGet("{reportId}")]
    public async Task<IActionResult> GetReportDetail(string reportId)
    {
        var userId = User.GetUserId();
        var isAdmin = User.IsInRole("Admin");
        if (!isAdmin && string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var detail = await _reportService.GetReportDetailAsync(reportId, userId ?? string.Empty, isAdmin);
        if (detail == null)
        {
            return NotFound();
        }

        return Ok(detail);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{reportId}/assign")]
    public async Task<IActionResult> AssignReport(string reportId, [FromBody] AssignReportRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return Unauthorized();
        }

        var result = await _reportService.AssignReportAsync(adminId, reportId, request);
        if (!result.Contains("success", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{reportId}/status")]
    public async Task<IActionResult> UpdateReportStatus(string reportId, [FromBody] UpdateReportStatusRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var adminId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return Unauthorized();
        }

        var result = await _reportService.UpdateReportStatusAsync(adminId, reportId, request);
        if (!result.Contains("updated", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpGet("my/submissions")]
    public async Task<IActionResult> GetMySubmittedReports()
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var statuses = await _reportService.GetReporterStatusesAsync(userId);
        return Ok(statuses);
    }

    [HttpGet("my/accusations")]
    public async Task<IActionResult> GetMyAccusations()
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var statuses = await _reportService.GetAccusedStatusesAsync(userId);
        return Ok(statuses);
    }

    [HttpPost("{reportId}/appeal")]
    public async Task<IActionResult> AppealReport(string reportId, [FromBody] ReportAppealRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await _reportService.SubmitAppealAsync(userId, reportId, request);
        if (!result.Contains("success", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
