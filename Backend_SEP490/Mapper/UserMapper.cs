using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper;

public class UserMapper : Profile
{
    public UserMapper()
    {
        CreateMap<User, RequestDTOUser>().ReverseMap();
        CreateMap<User, ResponseDTOUser>()
             .ForMember(dest => dest.Roles, opt => opt.MapFrom(src =>
                 src.UserRoles != null
                     ? src.UserRoles.Select(ur => ur.Role)
                     : null))
             .ForMember(dest => dest.Addresses, opt => opt.MapFrom(src => src.Addresses))
             .ReverseMap();
    }
}