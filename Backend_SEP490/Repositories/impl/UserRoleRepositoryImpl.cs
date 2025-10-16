using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories.impl;

public class UserRoleRepositoryImpl: GenericRepositoryImpl<UserRole>, IUserRoleRepository
{
    public UserRoleRepositoryImpl(AppDbContext context) : base(context)
    {
    }


    public async Task AddUserRoleAsync(UserRole userRole)
    {
        await _context.UserRoles.AddAsync(userRole);
        await _context.SaveChangesAsync();
    }
}