using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IProductRepositories
{
    public Task<IEnumerable<Product>> GetAvailableProductsAsync();

    public Task<Product> GetProductById(int id);
    public Task<Product> AddProduct(Product product);
}