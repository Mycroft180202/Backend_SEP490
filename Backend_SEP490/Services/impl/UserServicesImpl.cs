using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Repositories;
using Backend_SEP490.Models;
using Backend_SEP490.DTOs.Response;
using Microsoft.IdentityModel.Tokens;

namespace Backend_SEP490.Services.impl;

public class UserServicesImpl : GenericServices, IUserServices

{
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;
    public UserServicesImpl(IMapper mapper, IUnitOfWork unitOfWork, IConfiguration config,IEmailService emailService) : base(mapper, unitOfWork)
    {
        _config = config;
        _emailService = emailService;
    }

    public async Task<IEnumerable<ResponseDTOUser>> GetAllUsersAsync(RequestFilterUser requestFilter)
    {
        var users = await _context.Users.GetAllUsersWithRolesAsync();
        
        if (!string.IsNullOrEmpty(requestFilter.search)) 
        {
            users = users.Where(u => u.DisplayName.ToLower().Contains(requestFilter.search) || u.PhoneNumber.ToLower().Contains(requestFilter.search) 
                            ||  u.Username.ToLower().Contains(requestFilter.search) || u.Email.ToLower().Contains(requestFilter.search) ).ToList();
        }
        if(requestFilter.status != null)
        {
            users = users.Where(u => u.IsActive == requestFilter.status).ToList();
        }
        if (!string.IsNullOrEmpty(requestFilter.roleId))
        {
            users = users.Where( u => u.UserRoles.Any( ur => requestFilter.roleId.Equals(ur.RoleID))).ToList();
        }
        return _mapper.Map<IEnumerable<ResponseDTOUser>>(users);
    }
    public async Task<ResponseDTOUser?> GetUserByIDAsync(string userID)
    {
        var user = await _context.Users.GetUserByIDWithDetailAsync(userID);
        return _mapper.Map<ResponseDTOUser>(user);
    }

    public async Task<bool?> UpdateUserAsync(string userID , RequestUpdateUser request)
    {
        var user = await _context.Users.GetUserByIDWithDetailAsync(userID);

        if (user == null) 
        {
            return false;
        }

        var status = await _context.Users.UpdateUserAsync(user, request);

        
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

    // Hash mật khẩu nhập vào
    string hashedPassword = HashPassword(password);

    if (user.PasswordHash != hashedPassword) return null;

    var tokens = GenerateJwtTokens(user);

    // Lưu RefreshToken vào DB
    var refresh = new RefreshToken
    {
        Token = tokens.RefreshToken,
        Expires = DateTime.UtcNow.AddDays(7),
        UserId = user.UserID
    };
    await _context.RefreshTokens.AddAsync(refresh);
    await _context.SaveChangesAsync();

    return tokens;
}
    public async Task<ResponseDTOAuth?> RefreshTokenAsync(string refreshToken)
    {
        var tokenEntity = await _context.RefreshTokens
            .GetByTokenAsync(refreshToken);

        if (tokenEntity == null || !tokenEntity.IsActive) return null;

        var user = await _context.Users.GetByIdAsync(tokenEntity.UserId);
        if (user == null) return null;

        // revoke token cũ
        tokenEntity.Revoked = DateTime.UtcNow;

        var tokens = GenerateJwtTokens(user);

        var newRefresh = new RefreshToken
        {
            Token = tokens.RefreshToken,
            Expires = DateTime.UtcNow.AddDays(7),
            UserId = user.UserID
        };
        await _context.RefreshTokens.AddAsync(newRefresh);
        await _context.SaveChangesAsync();

        return tokens;
    }

    public async Task<bool> LogoutAsync(string refreshToken)
    {
        var tokenEntity = await _context.RefreshTokens
            .GetByTokenAsync(refreshToken);
        if (tokenEntity == null || !tokenEntity.IsActive) return false;

        tokenEntity.Revoked = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RegisterAsync(RequestDTORegister dto)
    {
        var existingUser = await _context.Users.GetUserByUsernameAsync(dto.Username);
        if (existingUser != null) return false;

        var existingEmail = await _context.Users.GetUserByEmailAsync(dto.Email);
        if (existingEmail != null) return false;

        // Sinh OTP
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

        // Gửi email
        await _emailService.SendEmailAsync(dto.Email, "Your OTP Code", $"Your OTP is: {otp}");

        return true;
        }

    public async Task<bool> VerifyOtpAsync(RequestDTORegister dto, string otp)
    {
        var otpEntity = await _context.UserOtps.GetValidOtpAsync(dto.Email, otp);
        if (otpEntity == null) return false;

        otpEntity.IsUsed = true;
        await _context.UserOtps.DeleteOtpAsync(otpEntity);
        string hashedPassword = HashPassword(dto.PasswordHash);

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

        // Gán role mặc định Customer
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


    public static string GenerateID(string prefix)
        {

            string timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");

            return $"{prefix}-{timestamp}";
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        private ResponseDTOAuth GenerateJwtTokens(User user)
        {
            var jwtSettings = _config.GetSection("Jwt");

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Username),
                new Claim("userId", user.UserID.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            foreach (var role in user.UserRoles.Select(ur => ur.Role.Name))
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expireMinutes = double.Parse(jwtSettings["ExpireMinutes"] ?? "60");
            var expireAt = DateTime.UtcNow.AddMinutes(expireMinutes);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: expireAt,
                signingCredentials: creds
            );

            var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

            return new ResponseDTOAuth
            {
                AccessToken = accessToken,
                RefreshToken = Guid.NewGuid().ToString("N"), // random string
                ExpireAt = expireAt
            };
        }
        public async Task<bool> ForgotPasswordAsync(string email)
        {
            // 1. Check user có tồn tại không
            var user = await _context.Users.GetUserByEmailAsync(email);
            if (user == null) return false;

            // 2. Sinh OTP ngẫu nhiên
            var otpCode = new Random().Next(100000, 999999).ToString();

            // 3. Lưu OTP vào DB
            var otpEntity = new UserOtp
            {
                Id = Guid.NewGuid().ToString(),
                Email = email,
                OtpCode = otpCode,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5), // hết hạn sau 5 phút
                IsUsed = false
            };

            await _context.UserOtps.AddOtpAsync(otpEntity);
            await _context.SaveChangesAsync();

            // 4. Gửi email
            var subject = "Forgot Password - Your OTP Code";
            var body = $"Xin chào {user.Username},\n\n" +
                       $"Mã OTP để đặt lại mật khẩu của bạn là: {otpCode}\n" +
                       $"OTP sẽ hết hạn trong 5 phút.\n\n" +
                       $"Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.";

            await _emailService.SendEmailAsync(email, subject, body);

            return true;
        }
        public async Task<bool> ResetPasswordAsync(RequestDTOResetPassword dto)
        {
            // 1. Check user có tồn tại
            var user = await _context.Users.GetUserByEmailAsync(dto.Email);
            if (user == null) return false;

            // 2. Tìm OTP
            var otpEntity = await _context.UserOtps.GetLatestOtpByEmailAsync(dto.Email);
            if (otpEntity == null) return false;

            // 3. Validate OTP
            if (otpEntity.IsUsed) return false;
            if (otpEntity.ExpiresAt < DateTime.UtcNow) return false;
            if (otpEntity.OtpCode != dto.OtpCode) return false;

            // 4. Cập nhật mật khẩu mới
            user.PasswordHash = HashPassword(dto.NewPassword);
            _context.Users.UpdateUserPasswordAsync(user);

            // 5. Đánh dấu OTP đã sử dụng
            otpEntity.IsUsed = true;
            _context.UserOtps.UpdateOtp(otpEntity);
            _context.UserOtps.DeleteOtpAsync(otpEntity);
            await _context.SaveChangesAsync();
            return true;
        }
    }
