using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IProductImagesRepositories
{
    public Task<IEnumerable<ProductImage>> GetImagesByProductIdAsync(string productId);
    public Task AddProductImageAsync(ProductImage productImage);
    public Task RemoveProductImageAsync(IEnumerable<ProductImage> images);
    Task<ProductImage> AddImageAsync(ProductImage image);
}