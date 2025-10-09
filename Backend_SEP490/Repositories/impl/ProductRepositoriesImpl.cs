using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class ProductRepositoriesImpl: GenericRepositoryImpl<Product>,IProductRepositories
{
    
    public ProductRepositoriesImpl(AppDbContext context) : base(context)
    {
        
    }


    public async Task<IEnumerable<Product>> GetAvailableProductsAsync()
    {
        var prodcutsAvailable= await _context.Products.Where(s=>s.IsActive==true).ToListAsync();
        return prodcutsAvailable;
    }
    

    
    public async Task<Product> AddProduct(Product product)
    {
       
            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            return product;
        
    }

    public async Task<Product?> GetProductByIdAsync(string productId)
    {
        var product = await _context.Products.FindAsync(productId);
        return product;
    }
}