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

    [Authorize(Roles = "Admin")]
    [HttpGet("orders")]
    public async Task<IActionResult> GetOrdersPaged([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10, [FromQuery] string? paymentStatus = null)
    {
        if (!string.IsNullOrWhiteSpace(paymentStatus))
        {
            var normalized = paymentStatus.Trim().ToLowerInvariant();
            if (normalized != "paid" && normalized != "unpaid")
            {
                return BadRequest("paymentStatus must be either 'paid' or 'unpaid'.");
            }
        }

        var result = await _orderServices.GetOrdersPagedAsync(pageIndex, pageSize, paymentStatus);
        return Ok(result);
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

        var result = await _orderServices.CreateOrderAsync(userId, request);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }

        return Ok(result.OrderId);
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
