using AutoMapper;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper
{
    public class CartItemMapper :Profile
    {
        public CartItemMapper() 
        {
            CreateMap<CartItem, ResponseDTOCartItem>()
               .ForMember(dest => dest.Product, opt => opt.MapFrom(src => src.Product)).ReverseMap();
        }
    }
}
