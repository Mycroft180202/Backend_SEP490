using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IUserRepositories
{
    public Task<IEnumerable<User>> GetAllUsersAsync();
    public Task<List<User>> GetAllUsersWithRolesAsync(int pageIndex, int pageSize);
    public Task<User?> GetUserByIDWithDetailAsync(string userID);
    public Task<string?> UpdateUserAsync(User user, RequestUpdateUser request);
    public Task<User?> GetUserByArtisanIDAsync(string artisanID);
    public Task<User?> GetUserByUsernameAsync(string username);
    public  Task<User?> GetByIdAsync(string userId);
    Task AddUserAsync(User user);
    Task<User?> GetUserByEmailAsync(string email);
    Task UpdateUserPasswordAsync(User user);
    Task<string> GetUserNameByIdAsync(string userId);
    Task<List<User>> GetUsersByIdsAsync(IEnumerable<string> userIds);

}