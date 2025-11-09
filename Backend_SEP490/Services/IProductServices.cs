using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using RequestDTOProduct = Backend_SEP490.DTOs.Response.RequestDTOProduct;
using Backend_SEP490.Data;
namespace Backend_SEP490.Services;

public interface IProductServices
{
    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetAvailableProductsAsync();
    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetUnavailableProductsAsync();
    public Task<ResponseDTOProductDetail> GetProductByIdAsync(string id);
    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetAllProductsAsync();
    public Task<bool> CreateProductAsync(RequestDTOProduct productDto);
    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByArtisanIdAsync(string artisanId);
    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByCategoryAsync(string categoryId);
    public Task<IEnumerable<DTOs.Request.ResponseDTOProduct>> GetProductsByNameAsync(string productName);
    public Task<bool> UpdateProductAsync(string id, RequestDTOProduct productDto);

    public Task<PagedResult<ResponseDTOProduct>> GetProductsAsync(
        string? productName, string? categoryId,bool? isactive, int pageIndex, int pageSize, string? sortBy = null);
    public Task<bool> DeleteProductAsync(string productId);
    
}