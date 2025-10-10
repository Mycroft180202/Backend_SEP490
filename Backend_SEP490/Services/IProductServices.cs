using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services;

public interface IProductServices
{
    public Task<IEnumerable<RequestDTOProduct>> GetAvailableProductsAsync();
    public Task<IEnumerable<RequestDTOProduct>> GetUnavailableProductsAsync();
    public Task<RequestDTOProductDetail> GetProductByIdAsync(string id);
    public Task<IEnumerable<RequestDTOProduct>> GetAllProductsAsync();
    public Task<bool> CreateProductAsync(ResponseDTOProduct productDto);
    public Task<IEnumerable<RequestDTOProduct>> GetProductsByArtisanIdAsync(string artisanId);
    public Task<IEnumerable<RequestDTOProduct>> GetProductsByCategoryAsync(string categoryId);
    public Task<IEnumerable<RequestDTOProduct>> GetProductsByNameAsync(string productName);
    public Task<bool> UpdateProductAsync(string id, ResponseDTOProduct productDto);
}