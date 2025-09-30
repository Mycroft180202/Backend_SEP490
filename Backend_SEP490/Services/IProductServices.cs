using Backend_SEP490.DTOs.Request;
namespace Backend_SEP490.Services;

public interface IProductServices
{
    public Task<List<RequestDTOProductList>> GetProductListAsync();
    public Task<RequestDTOProduct> GetProductByIdAsync(int id);
    public Task<Boolean> AddProductAsync(RequestDTOProduct product);
}