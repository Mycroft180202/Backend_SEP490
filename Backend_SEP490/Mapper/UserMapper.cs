using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper;

public class UserMapper : Profile
{
    public UserMapper()
    {
        CreateMap<User, ResponseDTOUser>().ReverseMap();
    }
}