using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Repositories;
using Backend_SEP490.Models;
using Backend_SEP490.DTOs.Response;
namespace Backend_SEP490.Services.impl;

public class UserServicesImpl: GenericServices, IUserServices
{
    public UserServicesImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
    {
    }

    public async Task<IEnumerable<ResponseDTOUser>> GetAllUsersAsync(string? search, bool? status)
    {
        var users = await _context.Users.GetAllUsersAsync();
        
        if (!string.IsNullOrEmpty(search)) 
        {
            users = users.Where(u => u.DisplayName.Contains(search) || u.PhoneNumber.Contains(search) 
                            ||  u.Username.Contains(search) || u.Email.Contains(search) ).ToList();
        }
        if(status != null)
        {
            users = users.Where(u => u.IsActive == status).ToList();
        }

        return _mapper.Map<IEnumerable<ResponseDTOUser>>(users);
    }

    public async Task<RequestDTOUser?> GetUserByArtisanIDAsync(string artisanID)
    {
        var user = await _context.Users.GetUserByArtisanIDAsync(artisanID);
        return _mapper.Map<RequestDTOUser>(user);
    }
}