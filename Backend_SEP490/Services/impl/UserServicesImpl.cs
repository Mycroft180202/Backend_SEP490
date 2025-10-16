using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Repositories;
using Backend_SEP490.Models;
using Microsoft.IdentityModel.Tokens;

namespace Backend_SEP490.Services.impl;

public class UserServicesImpl : GenericServices, IUserServices

{
    private readonly IConfiguration _config;

    public UserServicesImpl(IMapper mapper, IUnitOfWork unitOfWork, IConfiguration config) : base(mapper, unitOfWork)
    {
        _config = config;
    }

    public async Task<IEnumerable<ResponseDTOUser>> GetAllUsersAsync()
    {
        var users = await _context.Users.GetAllUsersAsync();
        return _mapper.Map<IEnumerable<ResponseDTOUser>>(users);
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
    }
