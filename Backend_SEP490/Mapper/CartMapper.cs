using AutoMapper;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper
{
    public class CartMapper: Profile
    {
        public CartMapper() 
        {
            CreateMap<Cart, ResponseDTOCart>()
                .ForMember(dest => dest.Customer, opt => opt.MapFrom(src => src.Customer))
                .ForMember(dest => dest.TotalAmmount,
                           opt => opt.MapFrom(src => src.CartItems != null
                               ? src.CartItems.Sum(ci => (ci.PriceAtAdd ?? 0) * (ci.Quantity ?? 0))
                               : 0))
                .ForMember(dest => dest.CartItems, opt => opt.Ignore()).ReverseMap();
        }
    }
}
