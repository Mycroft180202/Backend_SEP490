using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IProductRepositories
{
    public Task<IEnumerable<Product>> GetAvailableProductsAsync();
    public Task<IEnumerable<Product>> GetUnavailableProductsAsync();
    public Task<Product> AddProduct(Product product);
    public Task<Product?> GetProductByIdAsync(string productId);
    public Task<IEnumerable<Product>> GetAllProductsAsync();
}