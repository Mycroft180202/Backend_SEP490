using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend_SEP490.Controllers
{
    [Microsoft.AspNetCore.Components.Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderServices;

        public OrderController(IOrderService orderServices)
        {
            _orderServices = orderServices;
        }

        [HttpPost("my-orders")]
        public async Task<IActionResult> GetAllOrderByUserId([FromBody] RequestFilterOrder? requestFilter)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var orders = await _orderServices.GetAllOrderByUserIdAsync(userId, requestFilter);
            if (orders == null) NotFound();
            return Ok(orders);
        }
        [HttpGet("orders/{id}")]
        public async Task<IActionResult> GetAllOrderById([FromRoute]string orderId, [FromRoute] int pageIndex, [FromRoute] int pageSize)
        {
            var order = await _orderServices.GetOrderByIdAsync(orderId, pageIndex, pageSize);
            if (order == null) NotFound();
            return Ok(order);
        }

        [HttpPost("orders")]
        public async Task<IActionResult> CreateOrder([FromBody] RequestCreateOrder request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var useridc = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var status = await _orderServices.CreateOrderAsync(useridc, request);
            return Ok(status);
        }
    }
}
