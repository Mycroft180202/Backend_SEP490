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
[Authorize]
public class ProductController:ControllerBase
{
    private readonly IProductServices _productServices;
    private readonly IProductImagesServices _productImagesServices;
    public ProductController(IProductServices productServices, IProductImagesServices productImagesServices)
    {
        _productServices = productServices;
        _productImagesServices = productImagesServices;
    }

    [AllowAnonymous]
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
        
        var product = await _productServices.CreateProductAsync(productDto);
        return Ok(product);
    }
    [AllowAnonymous]
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
    [AllowAnonymous]
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? productName,
        [FromQuery] string? categoryId,
        [FromQuery] bool? isactive,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sortOrder = null) // thêm sort
    {
        var result = await _productServices.GetProductsAsync(
            productName, categoryId, isactive, pageIndex, pageSize, sortOrder);

        return Ok(result);
    }

    [Authorize(Roles = "Artisan,Admin")]
    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        var result = await _productServices.DeleteProductAsync(id);
        if (!result)
            return NotFound(new { message = $"Product with id {id} not found" });

        return NoContent(); 
    }

    [Authorize(Roles = "Artisan,Admin")]
    [HttpPatch("products/{id}/activation")]
    public async Task<IActionResult> UpdateProductActivation(string id, [FromBody] UpdateProductActivationRequest request)
    {
        if (request?.IsActive == null)
        {
            return BadRequest(new { message = "Activation state is required." });
        }

        var updated = await _productServices.UpdateProductIsActiveStatusAsync(id, request.IsActive.Value);
        if (!updated)
        {
            return NotFound(new { message = $"Product with id {id} not found" });
        }

        var statusText = request.IsActive.Value ? "activated" : "deactivated";
        return Ok(new { message = $"Product successfully {statusText}." });
    }
    [Authorize(Roles = "Artisan")]
    [HttpPost("image/add")]
    public async Task<IActionResult> AddProductImage([FromForm] RequestDTOAddProductImage dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var image = await _productImagesServices.AddProductImageAsync(dto);
            return Ok(new
            {
                message = "Image added successfully",
                data = image
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
