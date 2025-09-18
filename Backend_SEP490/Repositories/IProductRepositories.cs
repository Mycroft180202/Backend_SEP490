using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IProductRepositories
{
    public Task<List<Product>> GetProductsList();
}