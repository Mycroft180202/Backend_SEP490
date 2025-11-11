using Backend_SEP490.Data;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class ProductRepositoriesImpl : GenericRepositoryImpl<Product>, IProductRepositories
{
    public ProductRepositoriesImpl(AppDbContext context) : base(context)
    {
    }


    public async Task<IEnumerable<Product>> GetAvailableProductsAsync()
    {
        var prodcutsAvailable = await _context.Products.Where(s => s.IsActive == true).ToListAsync();
        return prodcutsAvailable;
    }

    public async Task<IEnumerable<Product>> GetUnavailableProductsAsync()
    {
        var prodcutsAvailable = await _context.Products.Where(s => s.IsActive == false).ToListAsync();
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
        var product = await _context.Products.Where(s => s.ArtisanId == artisanId).ToListAsync();
        return product;
    }

    public async Task<IEnumerable<Product>> GetProductsByCategoryAsync(string categoryId)
    {
        var product = await _context.Products.Where(o => o.Category == categoryId).ToListAsync();
        return product;
    }

    public async Task<IEnumerable<Product>> GetProductsByNameAsync(string productName)
    {
        var product = await _context.Products.Where(o => o.Name == productName).ToListAsync();
        return product;
    }

    public async Task UpdateAsync(Product product)
    {
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
    }

    public async Task<Product> GetProductWithImagesByIdAsync(string productId)
    {
        return await _context.Products
            .Include(p => p.ProductImages) // Eager load images
            .FirstOrDefaultAsync(p => p.Id == productId);
    }

    public async Task<PagedResult<Product>> GetProductsAsync(string? productName, string? categoryId,bool? isactive, int pageIndex,
        int pageSize)
    {
        IQueryable<Product> query = _context.Products.Where(p=>p.IsActive==isactive);

        if (!string.IsNullOrWhiteSpace(productName))
            query = query.Where(p => p.Name.Contains(productName));

        if (!string.IsNullOrEmpty(categoryId))
            query = query.Where(p => p.Category == categoryId);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(p => p.Name)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new Product
            {
                Id = p.Id,
                Name = p.Name,
                ShortDescription = p.ShortDescription,
                LongDescription = p.LongDescription,
                Price = p.Price,
                Category = p.Category,
                IsActive = p.IsActive,
                ArtisanId = p.ArtisanId,
                CreateAt = p.CreateAt,
                UpdateAt = p.UpdateAt,
                Stock = p.Stock,
            })
            .ToListAsync();

        return new PagedResult<Product>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    public async Task<List<Product>> GetProductsAsync(string? categoryId, bool? isActive)
    {
        var query = _context.Products.AsQueryable();

        if (!string.IsNullOrEmpty(categoryId))
            query = query.Where(p => p.Category == categoryId);

        if (isActive.HasValue)
            query = query.Where(p => p.IsActive == isActive.Value);

        return await query.ToListAsync();
    }

    public async Task<List<Product>> GetAllAsync()
    {
        return await _context.Products.ToListAsync();
    }

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();

    public async Task<List<Product>> GetProductsByIdsAsync(IEnumerable<string> productIds)
    {
        var ids = productIds?
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();

        if (ids == null || ids.Count == 0)
        {
            return new List<Product>();
        }

        return await _context.Products
            .Where(p => ids.Contains(p.Id))
            .ToListAsync();
    }
}
