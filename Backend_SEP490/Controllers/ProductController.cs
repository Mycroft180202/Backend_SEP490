using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Mvc;
using RequestDTOProduct = Backend_SEP490.DTOs.Response.RequestDTOProduct;

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
    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromForm] RequestDTOProduct productDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var product = await _productServices.CreateProductAsync(productDto);
        return Ok(product);
    }
    [HttpGet("products/artisan/{artisanId}")]
    public async Task<IActionResult> GetProductsByArtisanId([FromRoute] string artisanId)
    {
        var products = await _productServices.GetProductsByArtisanIdAsync(artisanId);
        if (products == null || !products.Any())
            return NotFound();
        return Ok(products);
    }  
    [HttpGet("products/category/{categoryId}")]
    public async Task<IActionResult> GetProductsByCategory([FromRoute] string categoryId)
    {
        var products = await _productServices.GetProductsByCategoryAsync(categoryId);
        if (products == null || !products.Any())
            return NotFound();
        return Ok(products);
    }
    [HttpGet("/products?productName={name}")]
    public async Task<IActionResult> GetProductsByName([FromQuery] string productName)
    {
        var products = await _productServices.GetProductsByNameAsync(productName);
        return Ok(products);
    }
    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromForm] RequestDTOProduct productDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var updatedProduct = await _productServices.UpdateProductAsync(id, productDto);

        if (updatedProduct == null)
            return NotFound();

        return Ok(updatedProduct);
    }


}