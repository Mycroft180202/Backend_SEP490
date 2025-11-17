using AutoMapper;
using Backend_SEP490.Constants;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Microsoft.Extensions.Logging;

namespace Backend_SEP490.Services.impl;

public class ArtisanApplicationService : GenericServices, IArtisanApplicationService
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<ArtisanApplicationService> _logger;

    public ArtisanApplicationService(
        IMapper mapper,
        IUnitOfWork unitOfWork,
        INotificationService notificationService,
        ILogger<ArtisanApplicationService> logger) : base(mapper, unitOfWork)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    private static string GenerateId(string prefix) => $"{prefix}-{DateTime.UtcNow:yyyyMMdd-HHmmssfff}";

    public async Task<(bool Success, string Message, ResponseArtisanApplicationDto? Data)> CreateAsync(string userId, RequestCreateArtisanApplication request)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return (false, "User is missing.", null);
        }

        var user = await _context.Users.GetByIdAsync(userId);
        if (user == null)
        {
            return (false, "User not found.", null);
        }

        if (await _context.ArtisanApplications.HasActiveApplicationAsync(userId))
        {
            return (false, "You already have a pending or approved artisan application.", null);
        }

        var yearsOfExperience = request.YearsOfExperience;
        if (yearsOfExperience.HasValue && yearsOfExperience.Value < 0)
        {
            yearsOfExperience = 0;
        }

        var application = new ArtisanApplication
        {
            Id = GenerateId("ARTAPP"),
            UserId = userId,
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            DateOfBirth = request.DateOfBirth,
            IdentityNumber = request.IdentityNumber,
            IdentityFrontImage = request.IdentityFrontImage,
            IdentityBackImage = request.IdentityBackImage,
            PortfolioUrl = request.PortfolioUrl,
            SkillDescription = request.SkillDescription,
            YearsOfExperience = yearsOfExperience,
            WorkshopAddress = request.WorkshopAddress,
            ShopName = request.ShopName,
            Bio = request.Bio,
            Status = ArtisanApplicationStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.ArtisanApplications.AddAsync(application);
        await _context.SaveChangesAsync();

        await _notificationService.NotifyArtisanApplicationSubmittedAsync(application, user);

        var dto = _mapper.Map<ResponseArtisanApplicationDto>(application);
        return (true, "Created artisan application successfully.", dto);
    }

    public async Task<ResponseArtisanApplicationDto?> GetMyApplicationAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return null;
        }

        var application = await _context.ArtisanApplications.GetLatestByUserAsync(userId);
        return _mapper.Map<ResponseArtisanApplicationDto?>(application);
    }

    public async Task<ResponseArtisanApplicationDto?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        var application = await _context.ArtisanApplications.GetByIdWithUserAsync(id);
        return _mapper.Map<ResponseArtisanApplicationDto?>(application);
    }

    public async Task<PagedResult<ResponseArtisanApplicationDto>> GetAllAsync(ArtisanApplicationFilterRequest filterRequest)
    {
        filterRequest ??= new ArtisanApplicationFilterRequest();

        var pageIndex = filterRequest.PageIndex <= 0 ? 1 : filterRequest.PageIndex;
        var pageSize = filterRequest.PageSize <= 0 ? 20 : Math.Min(filterRequest.PageSize, 100);

        var applications = await _context.ArtisanApplications
            .GetAsync(filterRequest.Status, filterRequest.Keyword, pageIndex, pageSize);
        var totalCount = await _context.ArtisanApplications
            .CountAsync(filterRequest.Status, filterRequest.Keyword);

        return new PagedResult<ResponseArtisanApplicationDto>
        {
            Items = _mapper.Map<IEnumerable<ResponseArtisanApplicationDto>>(applications),
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    public async Task<(bool Success, string Message)> ReviewAsync(string adminId, string applicationId, ReviewArtisanApplicationRequest request)
    {
        if (string.IsNullOrWhiteSpace(adminId))
        {
            return (false, "Reviewer is missing.");
        }

        var application = await _context.ArtisanApplications.GetByIdWithUserAsync(applicationId);
        if (application == null)
        {
            return (false, "Application not found.");
        }

        if (!string.Equals(application.Status, ArtisanApplicationStatus.Pending, StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Application has already been processed.");
        }

        if (!request.Approve && string.IsNullOrWhiteSpace(request.RejectReason))
        {
            return (false, "Reject reason is required when rejecting an application.");
        }

        await using var transaction = await _context.BeginTransactionAsync();
        try
        {
            application.Status = request.Approve ? ArtisanApplicationStatus.Done : ArtisanApplicationStatus.Rejected;
            application.AdminNote = request.AdminNote;
            application.RejectReason = request.Approve ? null : request.RejectReason;
            application.ReviewedBy = adminId;
            application.ReviewedAt = DateTime.UtcNow;
            application.UpdatedAt = DateTime.UtcNow;

            var applicant = application.User ?? await _context.Users.GetByIdAsync(application.UserId);
            if (applicant == null)
            {
                await transaction.RollbackAsync();
                return (false, "Applicant not found.");
            }

            if (request.Approve)
            {
                var artisanRole = await _context.Roles.GetByNameAsync("Artisan");
                if (artisanRole == null)
                {
                    await transaction.RollbackAsync();
                    return (false, "Role 'Artisan' is not configured.");
                }

                var customerRole = await _context.Roles.GetByNameAsync("Customer");
                var currentRoleIds = applicant.UserRoles?.Select(ur => ur.RoleID).ToHashSet() ?? new HashSet<string>();

                if (customerRole != null && !currentRoleIds.Contains(customerRole.Id))
                {
                    await _context.UserRoles.AddUserRoleAsync(new UserRole
                    {
                        Id = GenerateId("URID"),
                        UserID = applicant.UserID,
                        RoleID = customerRole.Id
                    });
                    currentRoleIds.Add(customerRole.Id);
                }

                if (!currentRoleIds.Contains(artisanRole.Id))
                {
                    await _context.UserRoles.AddUserRoleAsync(new UserRole
                    {
                        Id = GenerateId("URID"),
                        UserID = applicant.UserID,
                        RoleID = artisanRole.Id
                    });
                }

                if (!string.IsNullOrWhiteSpace(application.ShopName))
                {
                    applicant.ShopName = application.ShopName;
                }

                if (!string.IsNullOrWhiteSpace(application.Bio) || !string.IsNullOrWhiteSpace(application.SkillDescription))
                {
                    applicant.Bio = string.IsNullOrWhiteSpace(application.Bio)
                        ? application.SkillDescription
                        : application.Bio;
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            await _notificationService.NotifyArtisanApplicationReviewedAsync(application, application.User ?? applicant);
            return (true, "Application reviewed successfully.");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to review artisan application {ApplicationId}", applicationId);
            return (false, "Review failed, please try again.");
        }
    }
}
