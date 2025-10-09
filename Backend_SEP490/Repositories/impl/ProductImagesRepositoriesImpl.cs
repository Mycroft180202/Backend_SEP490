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
}