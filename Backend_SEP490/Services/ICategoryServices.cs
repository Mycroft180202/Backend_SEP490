using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services;

public interface ICategoryServices
{
    public Task<IEnumerable<ResponseDTOCategory>> GetAllCategories();
    public Task<bool> AddCategory(RequestDTOCategory category);
    public Task<bool> UpdateCategory(string id,RequestDTOCategory category);
}