using System.Linq;
using Backend_SEP490.Constants;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
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
    
    [Authorize]
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
    [HttpPost("orders/{orderNumber}/continue-payment")]
    public async Task<IActionResult> ContinueVnpayPayment([FromRoute] string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return BadRequest("Order number is required.");
        }

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var order = await _orderServices.GetOrderByNumberForUserAsync(userId, orderNumber);
        if (order == null)
        {
            return NotFound("Order not found.");
        }

        if (!string.Equals(order.PaymentType, "VNPAY", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("This order is not configured for VNPay payments.");
        }

        if (!string.Equals(order.Status, OrderStatuses.WaitingForPickup, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Only orders waiting for pickup can continue VNPay payment.");
        }

        var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        var clientIp = !string.IsNullOrWhiteSpace(forwarded)
            ? forwarded.Split(',').FirstOrDefault()
            : HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var paymentRequest = new CreateVnpayPaymentRequest
        {
            OrderId = order.Id
        };

        var paymentResponse = await _paymentService.CreateVnpayPaymentAsync(userId, paymentRequest, clientIp);
        if (paymentResponse == null)
        {
            return BadRequest(new { message = "Unable to continue VNPay payment for this order." });
        }

        return Ok(paymentResponse);
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

    [Authorize]
    [HttpPost("orders/{orderNumber}/confirm-received")]
    public async Task<IActionResult> ConfirmOrderReceived([FromRoute] string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return BadRequest("Order number is required.");
        }

        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await _orderServices.ConfirmOrderReceivedAsync(userId, orderNumber);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }

        return Ok(result.Message);
    }

    [Authorize(Roles = "Artisan")]
    [HttpPost("orders/{orderNumber}/confirm-artisan")]
    public async Task<IActionResult> ConfirmOrderByArtisan([FromRoute] string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return BadRequest("Order number is required.");
        }

        var artisanId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(artisanId))
        {
            return Unauthorized();
        }

        var result = await _orderServices.ConfirmOrderByArtisanAsync(artisanId, orderNumber);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }

        return Ok(result.Message);
    }

    [Authorize(Roles = "Artisan")]
    [HttpPost("orders/{orderNumber}/mark-shipping")]
    public async Task<IActionResult> MarkOrderAsShipping([FromRoute] string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return BadRequest("Order number is required.");
        }

        var artisanId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(artisanId))
        {
            return Unauthorized();
        }

        var result = await _orderServices.MarkOrderAsShippingByArtisanAsync(artisanId, orderNumber);
        if (!result.Success)
        {
            return BadRequest(result.Message);
        }

        return Ok(result.Message);
    }
}
