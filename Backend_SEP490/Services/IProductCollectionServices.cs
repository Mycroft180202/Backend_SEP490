using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services;

public interface IProductCollectionServices
{
    Task<IEnumerable<ResponseDTOProductCollection>> GetAllProducts();
    Task<ResponseDTOProductCollectionDetail> GetProductCollectionById(int id);
    public Task<ProductCollection> CreateAsync(RequestDTOCreateProductCollection dto);
    public Task<bool> SoftDeleteProductCollectionAsync(int id, string updatedByUserId);
    public Task<bool> DeleteProductCollectionAsync(int id);
    Task<bool> UpdateProductCollectionAsync(RequestDTOUpdateProductCollection dto, string updatedById);
}