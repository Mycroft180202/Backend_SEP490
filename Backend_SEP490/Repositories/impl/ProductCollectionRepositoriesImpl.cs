using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class ProductCollectionRepositoriesImpl: GenericRepositoryImpl<ProductCollection>, IProductCollectionRepositories
{
    public ProductCollectionRepositoriesImpl(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ProductCollection>> GetAllProductsCollection()
    {
        var productCollection = await _context.ProductCollections.Include( pc => pc.ProductCollectionItems).ToListAsync();
        return productCollection;
    }

    public async Task<ProductCollection> GetProductCollectionById(int id)
    {
        return await _context.ProductCollections.FindAsync(id);
    }

    public async Task<ICollection<Product>> GetAllProductsInCollection(int id)
    {
        var collection = await _context.ProductCollections
            .Include(pc => pc.ProductCollectionItems)
            .FirstOrDefaultAsync(pc => pc.ProductCollectionId == id);

        return collection?.ProductCollectionItems ?? new List<Product>();
    }

    public async Task<ProductCollection?> GetByIdAsync(int id)
    {
        return await _context.ProductCollections
            .Include(pc => pc.ProductCollectionItems)
            .FirstOrDefaultAsync(pc => pc.ProductCollectionId == id);
    }

    public async Task<List<Product>> GetProductsByIdsAsync(List<string> ids)
    {
        return await _context.Products
            .Where(p => ids.Contains(p.Id))
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task SoftDeleteAsync(ProductCollection collection)
    {
        collection.IsActive = false;
        collection.UpdatedDate = DateTime.UtcNow;

        _context.ProductCollections.Update(collection);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(ProductCollection collection, List<string> newProductIds)
    {
        collection.ProductCollectionItems.Clear();

        
        var newProducts = await _context.Products
            .Where(p => newProductIds.Contains(p.Id))
            .ToListAsync();

        foreach (var product in newProducts)
        {
            collection.ProductCollectionItems.Add(product);
        }

        _context.ProductCollections.Update(collection);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(ProductCollection collection)
    {
        try
        {
            _context.ProductCollections.Remove(collection);
            await _context.SaveChangesAsync();

        }
        catch (Exception ex)
        {
            return false;
        }
        return true;
    }
}