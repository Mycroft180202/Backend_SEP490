using AutoMapper;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper
{
    public class OrderMapper :Profile
    {
        public OrderMapper() 
        {
            CreateMap<Shipment, ResponseDTOShipment>();
            CreateMap<Order, ResponseDTOOrder>()
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.OrderItems))
                .ForMember(dest => dest.Shipments, opt => opt.MapFrom(src => src.Shipments))
                .ForMember(dest => dest.FeeShipping, opt => opt.MapFrom(src => src.ShippingFee))
                .ReverseMap();
        }
    }
}
