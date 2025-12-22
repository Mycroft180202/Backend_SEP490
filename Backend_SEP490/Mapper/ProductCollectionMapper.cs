using AutoMapper;
using Backend_SEP490.DTOs;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper;

public class ProductCollectionMapper:Profile
{
    public ProductCollectionMapper()
    {
        CreateMap<ProductCollection, ResponseDTOProductCollection>().ReverseMap();
        CreateMap<ProductCollection, ResponseDTOProductCollectionDetail>().ReverseMap();
        CreateMap<ProductCollection,RequestDTOCreateProductCollection>().ReverseMap();
        CreateMap<ProductCollection,RequestDTOUpdateProductCollection>().ReverseMap();
    }
}