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

    public async Task<IEnumerable<ResponseDTOUser>> GetAllUsersAsync(RequestFilter requestFilter)
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
    public async Task<RequestDTOUser?> GetUserByArtisanIDAsync(string artisanID)
    {
        var user = await _context.Users.GetUserByArtisanIDAsync(artisanID);
        return _mapper.Map<RequestDTOUser>(user);
    }
}