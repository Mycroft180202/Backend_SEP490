using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IProductCollectionRepositories
{
    Task<IEnumerable<ProductCollection>> GetAllProductsCollection();
    Task<ProductCollection> GetProductCollectionById(int id);
    Task<ICollection<Product>> GetAllProductsInCollection(int id);
    Task AddAsync(ProductCollection collection);
    Task<ProductCollection?> GetByIdAsync(int id);
    Task<List<Product>> GetProductsByIdsAsync(List<string> ids);
    Task SaveChangesAsync();
    Task SoftDeleteAsync(ProductCollection collection);
    Task UpdateAsync(ProductCollection collection, List<string> newProductIds);
}