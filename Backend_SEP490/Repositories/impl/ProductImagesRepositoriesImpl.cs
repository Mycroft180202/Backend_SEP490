using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class ProductImagesRepositoriesImpl: GenericRepositoryImpl<ProductImage>, IProductImagesRepositories
{
    public ProductImagesRepositoriesImpl(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ProductImage>> GetImagesByProductIdAsync(string productId)
    {
        var productImages = await _context.ProductImages.Where(o=>o.ProductId==productId).ToListAsync();
        return productImages;
    }

    public async Task AddProductImageAsync(ProductImage productImage)
    {
        await _context.ProductImages.AddAsync(productImage);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveProductImageAsync(IEnumerable<ProductImage> images)
    {
        _context.ProductImages.RemoveRange(images);
        await _context.SaveChangesAsync();
    }

    public async Task<ProductImage> AddImageAsync(ProductImage image)
    {
        _context.ProductImages.Add(image);
        await _context.SaveChangesAsync();
        return image;
    }
    public async Task<List<ProductImage>> GetImagesByProductIdsAsync(IEnumerable<string> productIds)
    {
        var ids = productIds?
            .Where(id => !string.IsNullOrEmpty(id))
            .Distinct()
            .ToList() ?? new List<string>();

        if (!ids.Any())
            return new List<ProductImage>();

        return await _context.ProductImages
            .Where(img => ids.Contains(img.ProductId))
            .ToListAsync();
    }

}