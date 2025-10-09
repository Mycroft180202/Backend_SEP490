using Backend_SEP490.DTOs.Request;
namespace Backend_SEP490.Services;

public interface IProductServices
{
    public Task<IEnumerable<RequestDTOProduct>> GetAvailableProductsAsync();
    public Task<Boolean> AddProductAsync(RequestDTOProduct product);
    public Task<RequestDTOProductDetail> GetProductByIdAsync(string id);
}