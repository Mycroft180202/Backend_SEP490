using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl;

public class ProductImageImpl: GenericServices,IProductImagesServices
{
    public ProductImageImpl(IMapper mapper, IUnitOfWork context) : base(mapper, context)
    {
    }

    public async Task<IEnumerable<RequestDTOProductImages>> GetImagesByProductIdAsync(string productId)
    {
        var images= await _context.ProductImages.GetImagesByProductIdAsync(productId);
        return _mapper.Map<IEnumerable<RequestDTOProductImages>>(images);
    }
}