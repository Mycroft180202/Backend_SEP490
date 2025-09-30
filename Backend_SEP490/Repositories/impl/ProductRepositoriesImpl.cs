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

    public async Task<Product> GetProductById(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return null;
        }
        else
        {
            return product;
        }
    }

    
    public async Task<Product> AddProduct(Product product)
    {
        product.ProductID =await _context.Products.CountAsync();
            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            return product;
        
    }
}