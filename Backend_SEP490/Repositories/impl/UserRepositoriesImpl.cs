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
        //Chỉnh sửa Role của user
        try 
        {   
            var existRoleId = await _context.UserRoles.Where(ur => ur.UserID.Equals(user.UserID) && ur.RoleID.Equals(request.RolesId)).FirstOrDefaultAsync();

            if (existRoleId == null) 
            {
                _context.UserRoles.Add(new UserRole
                {
                    Id = user.UserID + "-" + request.RolesId,
                    UserID = user.UserID,
                    RoleID = request.RolesId

                });
                _context.SaveChanges();
            }
           
        }
        catch(Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(ex);
            return false;
        }


        //Chỉnh sửa thông tin user
        try
        {
            user.IsActive = request.IsActive;
            user.PhoneNumber = request.PhoneNumber;
            user.DisplayName = request.DisplayName;
            user.Dob = request.Dob;
            user.ShopName = request.ShopName;
            user.UpdateAt = DateTime.UtcNow;
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