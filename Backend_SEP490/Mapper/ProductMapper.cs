using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper;

public class ProductMapper: Profile
{
    public ProductMapper()
    {
        CreateMap<Product, RequestDTOProductList>().ReverseMap();
    }
}