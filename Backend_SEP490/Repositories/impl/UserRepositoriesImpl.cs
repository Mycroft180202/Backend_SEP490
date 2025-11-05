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
        var user = await _context.Users.ToListAsync();
        return user;
    }

    public async Task<List<User>> GetAllUsersWithRolesAsync(int pageIndex, int pageSize)
    {
        var user = await _context.Users.OrderByDescending(u => u.CreateAt)  
                        .ThenBy(u => u.UserID).Skip((pageIndex -1) * pageSize).Take(pageSize)
                        .Include(u => u.UserRoles).Include(u => u.Addresses).ToListAsync();
        return user;
    }

    public async Task<User?> GetUserByIDWithDetailAsync(string userID)
    {
        var user = await _context.Users.Where(s => s.UserID.Equals(userID)).Include(u => u.UserRoles).ThenInclude(u => u.Role)
            .Include(u => u.Addresses).FirstOrDefaultAsync();
        return user;
    }

    public async Task<string?> UpdateUserAsync(User user, RequestUpdateUser request)
    {
        //Chỉnh sửa thông tin user
        try
        {
            if (!string.IsNullOrEmpty(request.DisplayName))
            {
                user.DisplayName = request.DisplayName;
            }
            if (!string.IsNullOrEmpty(request.PhoneNumber))
            {
                user.PhoneNumber = request.PhoneNumber;
            }
            if (!string.IsNullOrEmpty(request.UserUrlImage))
            {
                user.UserUrlImage = request.UserUrlImage;
            }
            if (request.Dob != null)
            {
                user.Dob = request.Dob;
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(ex);
            return "Update user information error!";
        }
        try
        {
            _context.Users.Update(user);
            _context.SaveChanges();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(ex);
            return "Update user information failed!";
        }
        return "Update user information succesfully!";
    }
    public async Task<User?> GetUserByArtisanIDAsync(string artisanID)
    {
        var user = await _context.Users.Where(s => s.UserID == artisanID).FirstOrDefaultAsync();
        return user;
    }

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        return await _context.Users.Include(u => u.UserRoles).ThenInclude(ur => ur.Role).FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByIdAsync(string userId)
    {
        return await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.UserID == userId);
    }

    public async Task AddUserAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task UpdateUserPasswordAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
    }

    public async Task<string> GetUserNameByIdAsync(string userId)
    {
        var user = await _context.Users.Where(u => u.UserID == userId).FirstOrDefaultAsync();
        return user.DisplayName;
    }

    public async Task<string?> UpdateUserAsync(User user, RequestAdminUpdateUser request)
    {
        //Chỉnh sửa Role của user
        try
        {
            if (!string.IsNullOrEmpty(request.RolesId))
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
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(ex);
            return "Update user role failed!";
        }
        //Chỉnh sửa thông tin user
        try
        {
           
            user.IsActive = request.IsActive;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(ex);
            return "Update user information error!";
        }
        try
        {
            _context.Users.Update(user);
            _context.SaveChanges();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(ex);
            return "Update user information failed!";
        }
        return "Update user information succesfully!";

    }
}