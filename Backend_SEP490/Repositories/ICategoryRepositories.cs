using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface ICategoryRepositories
{
    public Task<IEnumerable<Category>> GetAllCategories();
    public Task<bool> AddCategory(Category category);
    public Task<bool> UpdateCategory(Category category);
    public Task<Category> GetCategoryById(string id);
}