using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services;

public interface IProductImagesServices
{
    public Task<IEnumerable<RequestDTOProductImages>> GetImagesByProductIdAsync(string productId);
}