using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Repositories;
using Backend_SEP490.Models;
namespace Backend_SEP490.Services.impl;

public class UserServicesImpl: GenericServices, IUserServices
{
    public UserServicesImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
    {
    }

    public async Task<IEnumerable<ResponeseDTOUser>> GetAllUsersAsync()
    {
        var users = await _context.Users.GetAllUsersAsync();
        return _mapper.Map<IEnumerable<ResponeseDTOUser>>(users);
    }

    public async Task<ResponeseDTOUser?> GetUserByArtisanIDAsync(string artisanID)
    {
        var user = await _context.Users.GetUserByArtisanIDAsync(artisanID);
        return _mapper.Map<ResponeseDTOUser>(user);
    }
}