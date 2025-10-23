using System.Security.Claims;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;
[Microsoft.AspNetCore.Components.Route("api/[controller]")]
[ApiController]
public class ProductCollectionController: ControllerBase
{
    private readonly IProductCollectionServices _productCollectionServices;

    public ProductCollectionController(IProductCollectionServices productCollectionServices)
    {
        _productCollectionServices = productCollectionServices;
    }

    [HttpGet("productcollection")]
    public async Task<IActionResult> GetProductCollection()
    {
        var productCollection = await _productCollectionServices.GetAllProducts();
        return Ok(productCollection);
    }

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
        var userid= User.FindFirstValue("UserID");
        dto.CreatedById = userid;
        var result= _productCollectionServices.CreateAsync(dto);
        return Ok(new
        {
            message = "Created ProductCollection successfully",
        });
    }
    [Authorize(Roles = "Admin,Artisan")] 
    [HttpDelete("productcollection/{id}")]
    public async Task<IActionResult> SoftDeleteProductCollection(int id)
    {
        
        var userId = User.FindFirstValue("userId");
        if (userId == null)
            return Unauthorized(new { message = "Không xác định được người dùng." });

        var success = await _productCollectionServices.SoftDeleteProductCollectionAsync(id, userId);

        if (!success)
            return NotFound(new { message = "ProductCollection không tồn tại hoặc đã bị xóa." });

        return Ok(new { message = "Xóa mềm ProductCollection thành công." });
    }
    [Authorize(Roles = "Admin,Artisan")]
    [HttpPut("productcollection/{id}")]
    public async Task<IActionResult> UpdateProductCollection([FromBody] RequestDTOUpdateProductCollection dto)
    {
        var userId = User.FindFirstValue("userId");
        if (userId == null)
            return Unauthorized(new { message = "Không xác định được người dùng." });

        var result = await _productCollectionServices.UpdateProductCollectionAsync(dto, userId);
        if (!result)
            return NotFound(new { message = "Không tìm thấy ProductCollection hoặc không hợp lệ." });

        return Ok(new { message = "Cập nhật ProductCollection thành công." });
    }
}