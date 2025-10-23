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

    public async Task DeleteOtpAsync(string email)
    {
        var userOtp = await _context.UserOtps.Where(o => o.Email == email).ToListAsync();
        foreach (var Otp in userOtp)
        {
            _context.UserOtps.Remove(Otp);
        }
         await _context.SaveChangesAsync();
    }

    public async Task<UserOtp> GetLatestOtpByEmailAsync(string email)
    {
        return await _context.UserOtps
            .Where(o => o.Email == email)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public void UpdateOtp(UserOtp otp)
    {
        _context.UserOtps.Update(otp);
    }
}