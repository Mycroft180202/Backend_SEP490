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

    [HttpGet("products/available")]
    public async Task<IActionResult> GetAvailableProducts()
    {
        var products = await _productServices.GetAvailableProductsAsync();
        if (products == null || !products.Any())
            return NotFound();
        return Ok(products);
    }

    [HttpGet("products/{id}")]
    public async Task<IActionResult> GetProductById(string id)
    {
        var product = await _productServices.GetProductByIdAsync(id);
        return Ok(product);
    }
    [HttpGet("products/unavailable")]
    public async Task<IActionResult> GetUnavailableProducts()
    {
        var products = await _productServices.GetUnavailableProductsAsync();
        if (products == null || !products.Any())
            return NotFound();
        return Ok(products);
    }
    [HttpGet("products")]
    public async Task<IActionResult> GetAllProducts()
    {
        var products = await _productServices.GetAllProductsAsync();
        if (products == null || !products.Any())
            return NotFound();
        return Ok(products);
    }


}