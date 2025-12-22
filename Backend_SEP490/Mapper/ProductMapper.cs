using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using RequestDTOProduct = Backend_SEP490.DTOs.Response.RequestDTOProduct;

namespace Backend_SEP490.Mapper;

public class ProductMapper: Profile
{
    public ProductMapper()
    {
        CreateMap<Product, DTOs.Request.ResponseDTOProduct>().ReverseMap();
        CreateMap<Product,ResponseDTOProductDetail>().ReverseMap();
        CreateMap<Product,RequestDTOProduct>().ReverseMap();
        CreateMap<Product, ResponseDTOProductDashboard>()
                .ForMember(dest => dest.Product, opt => opt.MapFrom(src => src))
                .ForMember(dest => dest.TotalSold, opt => opt.MapFrom(src =>
                    src.OrderItems != null
                        ? src.OrderItems
                            .Where(oi => oi.Order != null && oi.Order.Status == "Paid")
                            .Sum(oi => oi.Quantity)
                        : 0
                ))
                .ForMember(dest => dest.TotalAmmount, opt => opt.MapFrom(src =>
                    src.OrderItems != null
                        ? src.OrderItems
                            .Where(oi => oi.Order != null && oi.Order.Status == "Paid")
                            .Sum(oi => oi.Quantity * oi.UnitPrice)
                        : 0m
                ));
    }
}