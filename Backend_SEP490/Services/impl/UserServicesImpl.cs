using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Repositories;
using Backend_SEP490.Models;
using Microsoft.IdentityModel.Tokens;

namespace Backend_SEP490.Services.impl;

public class UserServicesImpl: GenericServices, IUserServices

{
    private readonly IConfiguration _config;
    public UserServicesImpl(IMapper mapper, IUnitOfWork unitOfWork,IConfiguration config) : base(mapper, unitOfWork)
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

    public async Task<string?> LoginAsync(string username, string password)
    {
        var user = await _context.Users.GetUserByUsernameAsync(username);
        if (user != null)
        {
            return null;
        }

        if ( user.PasswordHash != password)
        {
            return null;
        }

        return GenerateJwtToken(user);
    }
    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _config.GetSection("Jwt");

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Username),
            new Claim("userId", user.UserID),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Nếu user có nhiều role thì add hết vào claims
        foreach (var role in user.UserRoles.Select(ur => ur.Role.Name))
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpireMinutes"] ?? "60")),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

}
