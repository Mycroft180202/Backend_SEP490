using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class UserOtpRepositoriesImpl: GenericRepositoryImpl<UserOtp>, IUserOtpRepositories
{
    public UserOtpRepositoriesImpl(AppDbContext context) : base(context)
    {
    }

    public async Task AddOtpAsync(UserOtp otp)
    {
        await _context.UserOtps.AddAsync(otp);
    }

    public async Task<UserOtp?> GetValidOtpAsync(string email, string otpCode)
    {
        return await _context.UserOtps
            .Where(o => o.Email == email 
                        && o.OtpCode == otpCode 
                        && !o.IsUsed 
                        && o.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task DeleteOtpAsync(UserOtp otp)
    {
         _context.UserOtps.Remove(otp);
         await _context.SaveChangesAsync();
    }
}