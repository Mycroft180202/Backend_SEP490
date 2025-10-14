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
        CreateMap<Product, DTOs.Request.ResponeseDTOProduct>().ReverseMap();
        CreateMap<Product,ResponseDTOProductDetail>().ReverseMap();
        CreateMap<Product,RequestDTOProduct>().ReverseMap();
    }
}