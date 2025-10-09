using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.Services;

public interface IProductImagesServices
{
    public Task<IEnumerable<RequestDTOProductImages>> GetImagesByProductIdAsync(string productId);
}