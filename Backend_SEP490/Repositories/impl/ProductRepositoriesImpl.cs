using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class ProductRepositoriesImpl: GenericRepositoryImpl<Product>,IProductRepositories
{
    
    public ProductRepositoriesImpl(AppDbContext context) : base(context)
    {
        
    }
    public async Task<List<Product>> GetProductsList()
    {
        var product = await _context.Products.ToListAsync();
        if (product == null)
        {
            return null;
        }
        else
        {
            return product;
        }
    }
}