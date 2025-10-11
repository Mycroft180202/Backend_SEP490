using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IUserRepositories
{
    public Task<IEnumerable<User>> GetAllUsersAsync();
    public Task<IEnumerable<User>> GetAllUsersWithRolesAsync();
    public Task<User?> GetUserByIDWithDetailAsync(string userID);
    public Task<User?> GetUserByArtisanIDAsync(string artisanID);
}