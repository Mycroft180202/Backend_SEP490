using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IArtisanApplicationRepository : IGenericRepository<ArtisanApplication>
{
    Task<ArtisanApplication?> GetByIdWithUserAsync(string id);
    Task<ArtisanApplication?> GetLatestByUserAsync(string userId);
    Task<bool> HasActiveApplicationAsync(string userId);
    Task<List<ArtisanApplication>> GetAsync(string? status, string? keyword, int pageIndex, int pageSize);
    Task<int> CountAsync(string? status, string? keyword);
}
