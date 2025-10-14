using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using RequestDTOProduct = Backend_SEP490.DTOs.Response.RequestDTOProduct;
using Backend_SEP490.Data;
namespace Backend_SEP490.Services;

public interface IProductServices
{
    public Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetAvailableProductsAsync();
    public Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetUnavailableProductsAsync();
    public Task<ResponseDTOProductDetail> GetProductByIdAsync(string id);
    public Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetAllProductsAsync();
    public Task<bool> CreateProductAsync(RequestDTOProduct productDto);
    public Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetProductsByArtisanIdAsync(string artisanId);
    public Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetProductsByCategoryAsync(string categoryId);
    public Task<IEnumerable<DTOs.Request.ResponeseDTOProduct>> GetProductsByNameAsync(string productName);
    public Task<bool> UpdateProductAsync(string id, RequestDTOProduct productDto);

    public Task<PagedResult<ResponeseDTOProduct>> GetProductsAsync(
        string? productName, string? categoryId, int pageIndex, int pageSize);
}