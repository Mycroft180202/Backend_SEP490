using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper;

public class ProductImagesMapper :Profile
{
    public ProductImagesMapper()
    {
        CreateMap<ResponseDTOProductImages,ProductImage>().ReverseMap();
        CreateMap<RequestDTOProductImage,ProductImage>().ReverseMap();
        CreateMap<RequestDTOAddProductImage, ProductImage>().ReverseMap();
    }
}