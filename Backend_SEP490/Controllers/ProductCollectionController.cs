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
public class ProductCollectionController : ControllerBase
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
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        if (dto.ImageFile != null)
        {
            var ext = Path.GetExtension(dto.ImageFile.FileName).ToLower();
            var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };

            if (!allowed.Contains(ext))
            {
                return BadRequest("Chỉ chấp nhận file ảnh có định dạng jpg, jpeg, png hoặc webp");
            }
        }
        var userid = User.FindFirstValue("UserID");
        dto.CreatedById = userid;
        var result = await _productCollectionServices.CreateAsync(dto);
        if (result == null)
        {
            return Ok(new
            {
                message = "Created ProductCollection failed!"
            });
        }
        return Ok(new
        {
            message = "Created ProductCollection successfully"
        });
    }
   
    [Authorize(Roles = "Admin,Artisan")]
    [HttpPut("productcollection")]
    public async Task<IActionResult> UpdateProductCollection([FromQuery] string userId, [FromForm] RequestDTOUpdateProductCollection dto)
    {
        if (userId == null)
            return Unauthorized(new { message = "Không xác định được người dùng." });

        var result = await _productCollectionServices.UpdateProductCollectionAsync(dto, userId);
        if (!result)
            return NotFound(new { message = "Không tìm thấy ProductCollection hoặc không hợp lệ." });

        return Ok(new { message = "Cập nhật ProductCollection thành công." });
    }

    [Authorize(Roles = "Admin,Artisan")]
    [HttpDelete("productcollection")]
    public async Task<IActionResult> DeleteProductCollection([FromQuery] string userId,[FromQuery] int id)
    {
        if (userId == null)
            return Unauthorized(new { message = "Không xác định được người dùng." });

        var status = await _productCollectionServices.DeleteProductCollectionAsync(id);

        if (!status)
            return Ok(new { message = "ProductCollection không tồn tại hoặc đã bị xóa." });

        return Ok(new { message = "Xóa mềm ProductCollection thành công." });
    }
}