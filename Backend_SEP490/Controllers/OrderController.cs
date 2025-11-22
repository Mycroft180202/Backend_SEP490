using System.Linq;
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
    private readonly IPaymentService _paymentService;

    public OrderController(IOrderService orderServices, IPaymentService paymentService)
    {
        _orderServices = orderServices;
        _paymentService = paymentService;
    }

    [Authorize]
    [HttpGet("my-orders")]
    public async Task<IActionResult> GetAllOrderByUserId([FromQuery] RequestFilterOrder? requestFilter)
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

        requestFilter ??= new RequestFilterOrder();

        var orders = await _orderServices.GetAllOrderByUserIdAsync(userId, requestFilter);
        return Ok(orders);
    }
    
    [HttpGet("orders/{orderId}")]
    public async Task<IActionResult> GetOrderById([FromRoute] string orderId)
    {
        if (string.IsNullOrWhiteSpace(orderId))
        {
            return BadRequest("Order id is required.");
        }

        var order = await _orderServices.GetOrderByIdAsync(orderId);
        if (order == null)
        {
            return NotFound();
        }

        return Ok(order);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("orders")]
    public async Task<IActionResult> GetOrdersPaged(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? paymentStatus = null)
    {
        pageIndex = pageIndex < 1 ? 1 : pageIndex;
        pageSize = pageSize < 1 ? 10 : pageSize;

        var normalizedStatus = string.IsNullOrWhiteSpace(paymentStatus)
            ? null
            : paymentStatus.Trim();

        var result = await _orderServices.GetOrdersPagedAsync(pageIndex, pageSize, normalizedStatus);
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
            return BadRequest(new { message = result.Message });
        }

        if (string.Equals(result.PaymentMethod, "VNPAY", StringComparison.OrdinalIgnoreCase))
        {
            var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            var clientIp = !string.IsNullOrWhiteSpace(forwarded)
                ? forwarded.Split(',').FirstOrDefault()
                : HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

            var paymentRequest = new CreateVnpayPaymentRequest
            {
                OrderId = result.OrderId,
                BankCode = request.BankCode
            };

            var paymentResponse = await _paymentService.CreateVnpayPaymentAsync(userId, paymentRequest, clientIp);
            if (paymentResponse == null)
            {
                return BadRequest(new { message = "Unable to initiate VNPay payment for this order." });
            }

            result.PaymentUrl = paymentResponse.PaymentUrl;
            result.PaymentId = paymentResponse.PaymentId;
        }

        return Ok(result);
    }

    [Authorize]
    [HttpPost("orders/{orderNumber}/cancel")]
    public async Task<IActionResult> CancelOrder([FromRoute] string orderNumber, [FromBody] RequestCancelOrder? request)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return BadRequest("Order id is required.");
        }

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var status = await _orderServices.CancelOrderAsync(userId, orderNumber, request);
        if (!status.Contains("success", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(status);
        }

        return Ok(status);
    }
}
