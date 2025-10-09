using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;
[Microsoft.AspNetCore.Components.Route("api/[controller]")]
[ApiController]
public class ProductController:ControllerBase
{
    private readonly IProductServices _productServices;

    public ProductController(IProductServices productServices)
    {
        _productServices = productServices;
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProductList()
    {
        var product = await _productServices.GetProductListAsync();
        return Ok(product);
    }

    [HttpGet("products/{id}")]
    public async Task<IActionResult> GetProductById(int id)
    {
        var product = await _productServices.GetProductByIdAsync(id);
        return Ok(product);
    }

    [HttpPost("products")]
    public async Task<IActionResult> AddProduct([FromBody] RequestDTOProduct product)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _productServices.AddProductAsync(product);

        return Ok(result);
    }
}