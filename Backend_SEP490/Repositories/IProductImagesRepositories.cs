using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IProductImagesRepositories
{
    public Task<IEnumerable<ProductImage>> GetImagesByProductIdAsync(string productId);
}