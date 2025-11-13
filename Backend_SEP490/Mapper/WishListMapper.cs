using AutoMapper;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper
{
    public class WishListMapper: Profile
    {
        public WishListMapper()
        {
            CreateMap<WishListItem, ResponseDTOWishListItem>()
                .ForMember(dest => dest.UserID, opt => opt.MapFrom(src => src.UserID))
                .ForMember(dest => dest.AddAt, opt => opt.MapFrom(src => src.AddAt))
                .ForMember(dest => dest.Product, opt => opt.MapFrom(src => src.Product));
        }
    }
}
