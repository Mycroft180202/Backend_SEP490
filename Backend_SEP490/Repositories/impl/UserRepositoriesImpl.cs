using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
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
                        .ThenBy(u => u.UserID).Skip((pageIndex - 1) * pageSize).Take(pageSize)
                        .Include(u => u.UserRoles).ThenInclude(u => u.Role).Include(u => u.Addresses).ToListAsync();
        return user;
    }

    public async Task<User?> GetUserByIDWithDetailAsync(string userID)
    {
        var user = await _context.Users.Where(s => s.UserID.Equals(userID)).Include(u => u.UserRoles).ThenInclude(u => u.Role)
            .Include(u => u.Addresses).FirstOrDefaultAsync();
        return user;
    }

    public async Task<string?> UpdateUserAsync(User user, RequestUpdateUser request, string imageURL)
    {
        //Chỉnh sửa thông tin user
        try
        {
            user.DisplayName = request.DisplayName;
            user.PhoneNumber = request.PhoneNumber;
            user.UserUrlImage = imageURL;
            user.Dob = DateTime.SpecifyKind(request.Dob.Value, DateTimeKind.Utc);
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

    public async Task<string?> UpdateUserAsync(User user, RequestAdminUpdateUser request, UserRole role)
    {
        //Chỉnh sửa Role của user
        try
        {
            if (role != null)
            {
                var existRoleId = await _context.UserRoles.Where(ur => ur.UserID.Equals(user.UserID) && ur.RoleID.Equals(request.RolesId)).FirstOrDefaultAsync();

                if (existRoleId == null)
                {
                    _context.UserRoles.Add(role);
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

    public async Task<string?> UpdateUserAsync(User user, RequestUpdateUserShop request, string imageURL)
    {
        //Chỉnh sửa thông tin user
        try
        {
            user.ShopName = request.ShopName;
            user.PhoneNumber = request.PhoneNumber;
            user.ShopUrlImage = imageURL;

        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(ex);
            return "Update artisan shop information error!";
        }
        try
        {
            _context.Users.Update(user);
            _context.SaveChanges();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(ex);
            return "Update artisan information failed!";
        }
        return "Update artisan information succesfully!";
    }

    public async Task<List<User>> GetUsersByIdsAsync(IEnumerable<string> userIds)
    {
        var ids = userIds?
            .Where(id => !string.IsNullOrEmpty(id))
            .Distinct()
            .ToList() ?? new List<string>();

        if (!ids.Any())
            return new List<User>();

        return await _context.Users
            .Where(u => ids.Contains(u.UserID))
            .ToListAsync();
    }

    public async Task<List<User>> GetUsersByRoleAsync(string roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return new List<User>();
        }

        return await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.UserRoles.Any(ur => ur.Role.Name == roleName))
            .ToListAsync();
    }

    public async Task<List<User>> GetActiveUsersAsync()
    {
        return await _context.Users
            .Where(u => u.IsActive)
            .ToListAsync();
    }

    public async Task<IEnumerable<User>> GetAllUsersWithRoleCustomerAsync()
    {
        var users = await _context.Users
                          .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                          .Include(u => u.Addresses).Include(u => u.Orders)
                          .Where(u => u.UserRoles.Any(ur => ur.Role.Name.Equals("Customer")))
                          .ToListAsync();
        return users;
    }

    public async Task<IEnumerable<User>> GetAllUsersWithRoleArtisanAsync()
    {

        var users = await _context.Users
                          .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                          .Include(u => u.Addresses)
                          .Include(u => u.Products).ThenInclude(p => p.OrderItems).ThenInclude(oi => oi.Order)
                          .Where(u => u.UserRoles.Any(ur => ur.Role.Name.Equals("Artisan")))
                          .ToListAsync();
        return users;
    }
}
