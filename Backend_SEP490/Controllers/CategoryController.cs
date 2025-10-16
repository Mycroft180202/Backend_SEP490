using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;
[Microsoft.AspNetCore.Components.Route("api/[controller]")]
[ApiController]
public class CategoryController: ControllerBase
{
    private readonly ICategoryServices _categoryServices;

    public CategoryController(ICategoryServices categoryServices)
    {
        _categoryServices = categoryServices;
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var category = await _categoryServices.GetAllCategories();
        return Ok(category);
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(string id, [FromBody] RequestDTOCategory category)
    {
        await _categoryServices.UpdateCategory(id, category);
        return Ok();
    }

    [HttpPost("categories")]
    public async Task<IActionResult> AddCategory([FromBody] RequestDTOCategory category)
    {
        await _categoryServices.AddCategory(category);
        return Ok();
    }
}