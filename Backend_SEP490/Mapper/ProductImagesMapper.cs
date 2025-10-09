using AutoMapper;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper;

public class ProductImagesMapper :Profile
{
    public ProductImagesMapper()
    {
        CreateMap<ProductImagesMapper,ProductImage>().ReverseMap();
    }
}