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

    [HttpGet("productlist")]
    public async Task<IActionResult> GetProductList()
    {
        var product = await _productServices.GetProductListAsync();
        return Ok(product);
    }
}