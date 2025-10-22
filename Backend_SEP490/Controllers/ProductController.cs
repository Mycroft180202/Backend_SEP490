using System.Security.Claims;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
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

    [HttpGet("products/{id}")]
    public async Task<IActionResult> GetProductById(string id)
    {
        var product = await _productServices.GetProductByIdAsync(id);
        return Ok(product);
    }
    [Authorize(Roles = "Artisan")]
    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromForm] RequestDTOProduct productDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        productDto.ArtisanId= User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
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
    [Authorize(Roles = "Artisan")]
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
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? productName,
        [FromQuery] string? categoryId,
        [FromQuery] bool? isactive,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _productServices.GetProductsAsync(productName, categoryId,isactive, pageIndex, pageSize);
        return Ok(result);
    }
    [Authorize(Roles = "Artisan,Admin")]
    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        var result = await _productServices.DeleteProductAsync(id);
        if (!result)
            return NotFound(new { message = $"Product with id {id} not found" });

        return NoContent(); // 204
    }

}