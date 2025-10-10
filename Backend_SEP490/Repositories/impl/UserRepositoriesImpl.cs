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

    public async Task<IEnumerable<User>> GetAllUsersWithRoleAsync()
    {
        var user = await _context.Users.Include( u => u.UserRoles).ToListAsync();
        return user;
    }

    public async Task<User?> GetUserByArtisanIDAsync(string artisanID)
    {
        var user = await _context.Users.Where(s => s.UserID == artisanID).FirstOrDefaultAsync();
        return user;
    }
}