using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class UserRepositoriesImpl : GenericRepositoryImpl<User>, IUserRepositories
{
    public UserRepositoriesImpl(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        var user= await _context.Users.ToListAsync();
        return user;
    }

    public async Task<User?> GetUserByArtisanIDAsync(string artisanID)
    {
        var user = await _context.Users.Where(s => s.UserID == artisanID).FirstOrDefaultAsync();
        return user;
    }

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        return await _context.Users.Include(u=>u.UserRoles).ThenInclude(ur=>ur.Role).FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByIdAsync(string userId)
    {
        return await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.UserID == userId);
    }

}