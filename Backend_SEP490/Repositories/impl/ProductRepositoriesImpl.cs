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
    public async Task<IEnumerable<Product>> GetUnavailableProductsAsync()
    {
        var prodcutsAvailable= await _context.Products.Where(s=>s.IsActive==false).ToListAsync();
        return prodcutsAvailable;
    }
    

    public async Task<Product?> GetProductByIdAsync(string productId)
    {
        var product = await _context.Products.FindAsync(productId);
        return product;
    }

    public async Task<IEnumerable<Product>> GetAllProductsAsync()
    {
        return await _context.Products.ToListAsync();
    }
    public async Task AddProductAsync(Product product)
    {
        await _context.Products.AddAsync(product);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Product>> GetProductsByArtisanIdAsync(string artisanId)
    {
        var product= await _context.Products.Where(s=>s.ArtisanId==artisanId).ToListAsync();
        return product;
    }

    public async Task<IEnumerable<Product>> GetProductsByCategoryAsync(string categoryId)
    {
        var product= await _context.Products.Where(o=>o.Category==categoryId).ToListAsync();
        return product;
    }

    public async Task<IEnumerable<Product>> GetProductsByNameAsync(string productName)
    {
        var product = await _context.Products.Where(o=>o.Name==productName).ToListAsync();
        return product;
    }

    public async Task UpdateAsync(Product product)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
    }
}