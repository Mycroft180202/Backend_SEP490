using Backend_SEP490.Constants;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class ArtisanApplicationRepository : GenericRepositoryImpl<ArtisanApplication>, IArtisanApplicationRepository
{
    public ArtisanApplicationRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<ArtisanApplication?> GetByIdWithUserAsync(string id)
    {
        return await _context.ArtisanApplications
            .Include(a => a.User)
                .ThenInclude(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(a => a.Reviewer)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<ArtisanApplication?> GetLatestByUserAsync(string userId)
    {
        return await _context.ArtisanApplications
            .Include(a => a.Reviewer)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> HasActiveApplicationAsync(string userId)
    {
        return await _context.ArtisanApplications
            .AnyAsync(a => a.UserId == userId &&
                           (a.Status == Constants.ArtisanApplicationStatus.Pending ||
                            a.Status == Constants.ArtisanApplicationStatus.Done));
    }

    public async Task<List<ArtisanApplication>> GetAsync(string? status, string? keyword, int pageIndex, int pageSize)
    {
        if (pageIndex < 1) pageIndex = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _context.ArtisanApplications
            .Include(a => a.User)
            .Include(a => a.Reviewer)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(a => a.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            keyword = keyword.Trim().ToLowerInvariant();
            query = query.Where(a =>
                (a.FullName != null && a.FullName.ToLower().Contains(keyword)) ||
                (a.Email != null && a.Email.ToLower().Contains(keyword)) ||
                (a.PhoneNumber != null && a.PhoneNumber.ToLower().Contains(keyword)) ||
                (a.IdentityNumber != null && a.IdentityNumber.ToLower().Contains(keyword)) ||
                (a.ShopName != null && a.ShopName.ToLower().Contains(keyword)));
        }

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> CountAsync(string? status, string? keyword)
    {
        var query = _context.ArtisanApplications.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(a => a.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            keyword = keyword.Trim().ToLowerInvariant();
            query = query.Where(a =>
                (a.FullName != null && a.FullName.ToLower().Contains(keyword)) ||
                (a.Email != null && a.Email.ToLower().Contains(keyword)) ||
                (a.PhoneNumber != null && a.PhoneNumber.ToLower().Contains(keyword)) ||
                (a.IdentityNumber != null && a.IdentityNumber.ToLower().Contains(keyword)) ||
                (a.ShopName != null && a.ShopName.ToLower().Contains(keyword)));
        }

        return await query.CountAsync();
    }
}
