using Backend_SEP490.Models;
using Backend_SEP490.Data;
namespace Backend_SEP490.Repositories;

public interface IProductRepositories
{
    public Task<IEnumerable<Product>> GetAvailableProductsAsync();
    public Task<IEnumerable<Product>> GetUnavailableProductsAsync();
    public Task<Product?> GetProductByIdAsync(string productId);
    public Task<IEnumerable<Product>> GetAllProductsAsync();
    public Task AddProductAsync(Product product);
    public Task<IEnumerable<Product>> GetProductsByArtisanIdAsync(string artisanId);
    public Task<IEnumerable<Product>> GetProductsByCategoryAsync(string categoryId);
    public Task<IEnumerable<Product>> GetProductsByNameAsync(string productName);
    public Task UpdateAsync(Product product);
    public Task<Product> GetProductWithImagesByIdAsync(string productId);
    public Task<PagedResult<Product>> GetProductsAsync(
        string? productName, 
        string? categoryId, 
        int pageIndex, 
        int pageSize);
}