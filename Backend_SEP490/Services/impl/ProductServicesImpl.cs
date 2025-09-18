using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl;

public class ProductServicesImpl: GenericServices, IProductServices
{
    public ProductServicesImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
    {
        
    }

    public async Task<List<RequestDTOProductList>> GetProductListAsync()
    {
        var product = await _context.Products.GetProductsList();
        var result = _mapper.Map<List<RequestDTOProductList>>(product);
        return result;
    }
}