using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class CategoryRepositoriesImpl: GenericRepositoryImpl<Category>, ICategoryRepositories
{
    public CategoryRepositoriesImpl(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Category>> GetAllCategories()
    {
        return await _context.Categories.ToListAsync();
    }

    public async Task<bool> AddCategory(Category category)
    {
        await _context.Categories.AddAsync(category);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateCategory(Category category)
    {
         _context.Categories.Update(category);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<Category> GetCategoryById(string id)
    {
        return await _context.Categories.FindAsync(id);
    }
}