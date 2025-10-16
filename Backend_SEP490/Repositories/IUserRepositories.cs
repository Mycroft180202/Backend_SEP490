using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IUserRepositories
{
    public Task<IEnumerable<User>> GetAllUsersAsync();
    public Task<User?> GetUserByArtisanIDAsync(string artisanID);
    public Task<User?> GetUserByUsernameAsync(string username);
    public  Task<User?> GetByIdAsync(string userId);
}