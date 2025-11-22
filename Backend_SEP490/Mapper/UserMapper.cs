using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper;

public class UserMapper : Profile
{
    public UserMapper()
    {
       //Default
        CreateMap<User, ResponseDTOUser>()
             .ForMember(dest => dest.Roles, opt => opt.MapFrom(src =>
                 src.UserRoles != null
                     ? src.UserRoles.Select(ur => ur.Role)
                     : null))
             .ForMember(dest => dest.Addresses, opt => opt.MapFrom(src => src.Addresses))
             .ReverseMap();
        CreateMap<User, ResponseDTOUserShop>()
            .ForMember(dest => dest.Addresses, opt => opt.MapFrom(src => src.Addresses))
            .ReverseMap();
        //Dashboard
        CreateMap<User, ResponseDTOUserDashboard>()
            .ForMember(dest => dest.Roles, opt => opt.MapFrom(src =>
                src.UserRoles != null
                    ? src.UserRoles.Select(ur => ur.Role)
                    : null))
            .ForMember(dest => dest.Addresses, opt => opt.MapFrom(src => src.Addresses))
            .ForMember(dest => dest.TotalSpendMoney,
               opt => opt.MapFrom(src => src.Orders != null
                    ? src.Orders.Sum(o => o.TotalAmount)
                    : 0))
            .ReverseMap();
        CreateMap<User, ResponseDTOUserShopDashboard>()
            .ForMember(dest => dest.Addresses, opt => opt.MapFrom(src => src.Addresses))
            .ForMember(dest => dest.TotalRevenue, opt => opt.MapFrom(
            src => src.Products != null
            ? src.Products
                .SelectMany(p => p.OrderItems)
                .Where(oi => oi.Order.Status == "Completed")
                .Sum(oi => oi.UnitPrice * oi.Quantity)
            : 0
            ))
            .ReverseMap();
    }
}