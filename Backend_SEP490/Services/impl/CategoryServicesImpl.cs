using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Repositories.impl;

namespace Backend_SEP490.Services.impl;

public class CategoryServicesImpl: GenericServices, ICategoryServices
{
    public CategoryServicesImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
    {
    }

    public async Task<IEnumerable<ResponseDTOCategory>> GetAllCategories()
    {
        var categories = await _context.Categories.GetAllCategories();
        var mappedCategories = _mapper.Map<IEnumerable<Category>, IEnumerable<ResponseDTOCategory>>(categories);
        return mappedCategories;
    }

    public async Task<bool> AddCategory(RequestDTOCategory category)
    {
        var categoryToAdd = _mapper.Map<Category>(category);
        categoryToAdd.Id = GenerateID("CATE");
        await _context.Categories.AddCategory(categoryToAdd);
        return true;
    }

    public async Task<bool> UpdateCategory(string id,RequestDTOCategory category)
    {
        var categoryToUpdate = await _context.Categories.GetCategoryById(id);
        categoryToUpdate.Name = category.Name;
        _context.Categories.UpdateCategory(categoryToUpdate);
        return true;
    }
    public static string GenerateID(string prefix)
    {   
        
        string timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");

        return $"{prefix}-{timestamp}";
    }
}