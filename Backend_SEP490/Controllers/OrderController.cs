using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderServices;

    public OrderController(IOrderService orderServices)
    {
        _orderServices = orderServices;
    }

    [Authorize]
    [HttpPost("my-orders")]
    public async Task<IActionResult> GetAllOrderByUserId([FromBody] RequestFilterOrder? requestFilter)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var orders = await _orderServices.GetAllOrderByUserIdAsync(userId, requestFilter);
        return Ok(orders);
    }

    [HttpGet("orders/{orderId}")]
    public async Task<IActionResult> GetOrderById([FromRoute] string orderId, [FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
    {
        if (string.IsNullOrWhiteSpace(orderId))
        {
            return BadRequest("Order id is required.");
        }

        var order = await _orderServices.GetOrderByIdAsync(orderId, pageIndex, pageSize);
        if (order == null)
        {
            return NotFound();
        }

        return Ok(order);
    }

    [Authorize]
    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] RequestCreateOrder request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var status = await _orderServices.CreateOrderAsync(userId, request);
        if (!status.StartsWith("Create order successfully", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(status);
        }

        return Ok(status);
    }

    [Authorize]
    [HttpPost("orders/{orderId}/cancel")]
    public async Task<IActionResult> CancelOrder([FromRoute] string orderId, [FromBody] RequestCancelOrder? request)
    {
        if (string.IsNullOrWhiteSpace(orderId))
        {
            return BadRequest("Order id is required.");
        }

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var status = await _orderServices.CancelOrderAsync(userId, orderId, request);
        if (!status.Contains("success", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(status);
        }

        return Ok(status);
    }
}
