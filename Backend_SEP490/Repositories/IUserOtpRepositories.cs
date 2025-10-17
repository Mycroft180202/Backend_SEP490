using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IUserOtpRepositories
{
    Task AddOtpAsync(UserOtp otp);
    Task<UserOtp?> GetValidOtpAsync(string email, string otpCode);
    Task SaveChangesAsync();
    Task DeleteOtpAsync(UserOtp otp);
}