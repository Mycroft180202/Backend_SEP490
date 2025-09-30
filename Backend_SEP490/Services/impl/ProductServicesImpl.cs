using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
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

    public async Task<RequestDTOProduct> GetProductByIdAsync(int id)
    {
        var product = await _context.Products.GetProductById(id);
        var result = _mapper.Map<RequestDTOProduct>(product);
        return result;
    }

    public async Task<Boolean> AddProductAsync(RequestDTOProduct product)
    {
        var newProduct = _mapper.Map<Product>(product);
        var result= await _context.Products.AddProduct(newProduct);
        return true;
    }
}