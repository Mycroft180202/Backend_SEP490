using System.IO;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Microsoft.AspNetCore.Components.Route("api/[controller]")]
[ApiController]
[Authorize]
public class ProductCollectionController : ControllerBase
{
    private readonly IProductCollectionServices _productCollectionServices;

    public ProductCollectionController(IProductCollectionServices productCollectionServices)
    {
        _productCollectionServices = productCollectionServices;
    }

    [AllowAnonymous]
    [HttpGet("productcollection")]
    public async Task<IActionResult> GetProductCollection()
    {
        var productCollection = await _productCollectionServices.GetAllProducts();
        return Ok(productCollection);
    }

    [AllowAnonymous]
    [HttpGet("productcollection/{id}")]
    public async Task<IActionResult> GetProductCollection(int id)
    {
        var productCollection = await _productCollectionServices.GetProductCollectionById(id);
        return Ok(productCollection);
    }

    [Authorize(Roles = "Admin,Artisan")]
    [HttpPost("productcollection")]
    public async Task<IActionResult> Create([FromForm] RequestDTOCreateProductCollection dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (dto.ImageFile != null)
        {
            var ext = Path.GetExtension(dto.ImageFile.FileName).ToLower();
            var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };

            if (!allowed.Contains(ext))
            {
                return BadRequest("Only jpg, jpeg, png or webp images are supported.");
            }
        }

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Unable to determine current user." });
        }

        dto.CreatedById = userId;
        var result = await _productCollectionServices.CreateAsync(dto);
        if (result == null)
        {
            return Ok(new { message = "Created ProductCollection failed!" });
        }

        return Ok(new { message = "Created ProductCollection successfully" });
    }

    [Authorize(Roles = "Admin,Artisan")]
    [HttpPut("productcollection")]
    public async Task<IActionResult> UpdateProductCollection([FromForm] RequestDTOUpdateProductCollection dto)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Unable to determine current user." });
        }

        var result = await _productCollectionServices.UpdateProductCollectionAsync(dto, userId);
        if (!result)
        {
            return NotFound(new { message = "ProductCollection not found or invalid." });
        }

        return Ok(new { message = "ProductCollection updated successfully." });
    }

    [Authorize(Roles = "Admin,Artisan")]
    [HttpDelete("productcollection")]
    public async Task<IActionResult> DeleteProductCollection([FromQuery] int id)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "Unable to determine current user." });
        }

        var status = await _productCollectionServices.DeleteProductCollectionAsync(id);
        if (!status)
        {
            return Ok(new { message = "ProductCollection does not exist or was deleted." });
        }

        return Ok(new { message = "Soft deleted ProductCollection successfully." });
    }
}
