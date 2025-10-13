using Backend_SEP490.DTOs.Request;
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

    public async Task<IEnumerable<User>> GetAllUsersWithRolesAsync()
    {
        var user = await _context.Users.Include( u => u.UserRoles).Include(u => u.Addresses).ToListAsync();
        return user;
    }

    public async Task<User?> GetUserByIDWithDetailAsync(string userID)
    {
        var user = await _context.Users.Where(s => s.UserID.Equals(userID)).Include(u => u.UserRoles).ThenInclude(u => u.Role)
            .Include(u => u.Addresses).FirstOrDefaultAsync();
        return user;
    }

    public async Task<bool?> UpdateUserAsync(User user, RequestUpdateUser request)
    {
        try
        {
            user.IsActive = request.IsActive;
            user.PhoneNumber = request.PhoneNumber;
            user.DisplayName = request.DisplayName;
            user.Dob = request.Dob;
            user.ShopName = request.ShopName;
        }
        catch (Exception ex) 
        {
            System.Diagnostics.Debug.WriteLine(ex);
           return false;
        }
        try
        {
            _context.Users.Update(user);
            _context.SaveChanges();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(ex);
            return false;
        }
        return true;
    }
    public async Task<User?> GetUserByArtisanIDAsync(string artisanID)
    {
        var user = await _context.Users.Where(s => s.UserID == artisanID).FirstOrDefaultAsync();
        return user;
    }
}