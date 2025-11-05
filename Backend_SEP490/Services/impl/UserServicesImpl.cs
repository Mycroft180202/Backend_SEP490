using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Backend_SEP490.Services.impl;

public class UserServicesImpl : GenericServices, IUserServices
{
    private readonly IEmailService _emailService;

    private readonly string _jwtKey;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;
    private readonly double _jwtExpireMinutes;
    private readonly double _jwtRefreshTokenExpireDays;
    private readonly Cloudinary _cloudinary;

    public UserServicesImpl(IMapper mapper, IUnitOfWork unitOfWork, IEmailService emailService, Cloudinary cloudinary)
        : base(mapper, unitOfWork)
    {
        _emailService = emailService;
        _cloudinary = cloudinary;
        // Lấy từ environment
        _jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? throw new Exception("JWT_KEY is not set");
        _jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? throw new Exception("JWT_ISSUER is not set");
        _jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? throw new Exception("JWT_AUDIENCE is not set");
        _jwtExpireMinutes = double.Parse(Environment.GetEnvironmentVariable("JWT_EXPIRE_MINUTES") ?? "15");
        _jwtRefreshTokenExpireDays = double.Parse(Environment.GetEnvironmentVariable("JWT_REFRESH_TOKEN_EXPIRE_DAYS") ?? "7");
    }

    public async Task<PagedResult<ResponseDTOUser>> GetAllUsersAsync(RequestFilterUser requestFilter, int pageIndex, int pageSize)
    {
        var usersList = await _context.Users.GetAllUsersAsync();
        var users = await _context.Users.GetAllUsersWithRolesAsync(pageIndex, pageSize);

        if (!string.IsNullOrEmpty(requestFilter.search))
        {
            users = users.Where(u => u.DisplayName.ToLower().Contains(requestFilter.search.ToLower()) || u.PhoneNumber.ToLower().Contains(requestFilter.search.ToLower())
                            || u.Username.ToLower().Contains(requestFilter.search.ToLower()) || u.Email.ToLower().Contains(requestFilter.search.ToLower())).ToList();
        }
        if (requestFilter.status != null)
        {
            users = users.Where(u => u.IsActive == requestFilter.status).ToList();
        }
        if (!string.IsNullOrEmpty(requestFilter.roleId))
        {
            users = users.Where(u => u.UserRoles.Any(ur => requestFilter.roleId.Equals(ur.RoleID))).ToList();
        }
       
        var userList = _mapper.Map<IEnumerable<ResponseDTOUser>>(users);

        return new PagedResult<ResponseDTOUser>
        {
            Items = userList,
            TotalCount = usersList.Count(),
            PageIndex = pageIndex,
            PageSize = pageSize
        };

    }
    public async Task<ResponseDTOUser?> GetUserByIDAsync(string userID)
    {
        var user = await _context.Users.GetUserByIDWithDetailAsync(userID);
        return _mapper.Map<ResponseDTOUser>(user);
    }

    public async Task<string?> UpdateUserAsync(string userID, RequestUpdateUser request)
    {
        var user = await _context.Users.GetUserByIDWithDetailAsync(userID);

        if (user == null)
        {
            return "User not found!";
        }
        using var stream = request.UserUrlImage.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(request.UserUrlImage.FileName, stream)
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);
        var status = await _context.Users.UpdateUserAsync(user, request, uploadResult.SecureUrl.ToString());


        return status;
    }
    public async Task<ResponseDTOUser?> GetUserByArtisanIDAsync(string artisanID)
    {
        var user = await _context.Users.GetUserByArtisanIDAsync(artisanID);
        return _mapper.Map<ResponseDTOUser>(user);
    }

    public async Task<ResponseDTOAuth?> LoginAsync(string username, string password)
    {
        var user = await _context.Users.GetUserByUsernameAsync(username);
        if (user == null) return null;

        if (user.PasswordHash != HashPassword(password)) return null;

        var tokens = GenerateJwtTokens(user);

        var refresh = new RefreshToken
        {
            Token = tokens.RefreshToken,
            Expires = DateTime.UtcNow.AddDays(_jwtRefreshTokenExpireDays),
            UserId = user.UserID
        };
        await _context.RefreshTokens.AddAsync(refresh);
        await _context.SaveChangesAsync();

        return tokens;
    }

    public async Task<ResponseDTOAuth?> RefreshTokenAsync(string refreshToken)
    {
        // Lấy token hiện tại
        var tokenEntity = await _context.RefreshTokens.GetByTokenAsync(refreshToken);
        if (tokenEntity == null || !tokenEntity.IsActive) return null;

        var user = await _context.Users.GetByIdAsync(tokenEntity.UserId);
        if (user == null) return null;

        // Xóa token cũ khỏi database
        await _context.RefreshTokens.RemoveByTokenAsync(tokenEntity);

        // Tạo token mới
        var tokens = GenerateJwtTokens(user);

        var newRefresh = new RefreshToken
        {
            Token = tokens.RefreshToken,
            Expires = DateTime.UtcNow.AddDays(_jwtRefreshTokenExpireDays),
            UserId = user.UserID
        };

        await _context.RefreshTokens.AddAsync(newRefresh);
        await _context.SaveChangesAsync();

        return tokens;
    }


    public async Task<bool> LogoutAsync(string refreshToken)
    {
        var tokenEntity = await _context.RefreshTokens.GetByTokenAsync(refreshToken);
        if (tokenEntity == null || !tokenEntity.IsActive) return false;

        tokenEntity.Revoked = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RegisterAsync(RequestDTORegister dto)
    {
        if (await _context.Users.GetUserByUsernameAsync(dto.Username) != null) return false;
        if (await _context.Users.GetUserByEmailAsync(dto.Email) != null) return false;

        string otp = new Random().Next(100000, 999999).ToString();

        var otpEntity = new UserOtp
        {
            Id = Guid.NewGuid().ToString(),
            Email = dto.Email,
            OtpCode = otp,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5)
        };

        await _context.UserOtps.AddOtpAsync(otpEntity);
        await _context.UserOtps.SaveChangesAsync();

        await _emailService.SendEmailAsync(dto.Email, "Your OTP Code", $"Your OTP is: {otp}");

        return true;
    }

    public async Task<bool> VerifyOtpAsync(RequestDTORegister dto, string otp)
    {
        var otpEntity = await _context.UserOtps.GetValidOtpAsync(dto.Email, otp);
        if (otpEntity == null) return false;

        otpEntity.IsUsed = true;
        await _context.UserOtps.DeleteOtpAsync(dto.Email);

        var hashedPassword = HashPassword(dto.PasswordHash);

        var newUser = new User
        {
            UserID = GenerateID("USER"),
            Username = dto.Username,
            PasswordHash = hashedPassword,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            DisplayName = dto.DisplayName,
            Dob = dto.Dob,
            IsActive = true,
            CreateAt = DateTime.UtcNow,
            UpdateAt = DateTime.UtcNow
        };

        await _context.Users.AddUserAsync(newUser);

        var customerRole = await _context.Roles.GetByNameAsync("Customer");
        if (customerRole != null)
        {
            var userRole = new UserRole
            {
                Id = GenerateID("URID"),
                UserID = newUser.UserID,
                RoleID = customerRole.Id
            };
            await _context.UserRoles.AddUserRoleAsync(userRole);
        }

        await _context.UserOtps.SaveChangesAsync();
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ForgotPasswordAsync(string email)
    {
        var user = await _context.Users.GetUserByEmailAsync(email);
        if (user == null) return false;

        var otpCode = new Random().Next(100000, 999999).ToString();

        var otpEntity = new UserOtp
        {
            Id = Guid.NewGuid().ToString(),
            Email = email,
            OtpCode = otpCode,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false
        };

        await _context.UserOtps.AddOtpAsync(otpEntity);
        await _context.SaveChangesAsync();

        var subject = "Forgot Password - OTP";
        var body = $"Xin chào {user.Username}, OTP để đặt lại mật khẩu là: {otpCode}, hết hạn sau 5 phút.";

        await _emailService.SendEmailAsync(email, subject, body);

        return true;
    }

    public async Task<bool> ResetPasswordAsync(RequestDTOResetPassword dto)
    {
        var user = await _context.Users.GetUserByEmailAsync(dto.Email);
        if (user == null) return false;

        var otpEntity = await _context.UserOtps.GetLatestOtpByEmailAsync(dto.Email);
        if (otpEntity == null) return false;

        if (otpEntity.IsUsed || otpEntity.ExpiresAt < DateTime.UtcNow || otpEntity.OtpCode != dto.OtpCode)
            return false;

        user.PasswordHash = HashPassword(dto.NewPassword);
        await _context.Users.UpdateUserPasswordAsync(user);

        otpEntity.IsUsed = true;
        _context.UserOtps.UpdateOtp(otpEntity);
        await _context.UserOtps.DeleteOtpAsync(dto.Email);

        await _context.SaveChangesAsync();
        return true;
    }

    private string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    private string GenerateID(string prefix) => $"{prefix}-{DateTime.UtcNow:yyyyMMdd-HHmmss}";

    private ResponseDTOAuth GenerateJwtTokens(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Username),
            new Claim("userId", user.UserID),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        foreach (var role in user.UserRoles.Select(ur => ur.Role.Name))
            claims.Add(new Claim(ClaimTypes.Role, role));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expireAt = DateTime.UtcNow.AddMinutes(_jwtExpireMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtIssuer,
            audience: _jwtAudience,
            claims: claims,
            expires: expireAt,
            signingCredentials: creds
        );

        return new ResponseDTOAuth
        {
            AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
            RefreshToken = Guid.NewGuid().ToString("N"),
            ExpireAt = expireAt
        };
    }

    public async Task<string> ChangePasswordAsync(string userId, RequestUpdateUserHashPassword request)
    {
        //Check xem nguoi dung co ton tai khong
        var user = await _context.Users.GetByIdAsync(userId);
        if (user == null) return "User not found!";

        // So sanh xem mat khau cu co dung khong
        string hashedPassword = HashPassword(request.OldPassword);
        if (!user.PasswordHash.Equals(hashedPassword)) return "Wrong old password";

        //Check xem new password co giong newconfirm password khong
        if (!request.NewPassword.Equals(request.ConfirmNewPassword)) return "New password is different with confirm new password!";

        //Sau khi check xong thi cap nhat mat khau nguoi dung
        user.PasswordHash = HashPassword(request.NewPassword);
        _context.Users.UpdateUserPasswordAsync(user);

        return "Change password successfully!";
    }

    public async Task<string?> UpdateUserAsync(string userID, RequestAdminUpdateUser request)
    {
        var user = await _context.Users.GetUserByIDWithDetailAsync(userID);

        if (user == null)
        {
            return "User not found!";
        }

        var status = await _context.Users.UpdateUserAsync(user, request);


        return status;
    }
}
