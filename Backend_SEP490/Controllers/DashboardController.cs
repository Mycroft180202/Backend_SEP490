using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers
{
    // Bỏ "api/[controller]" để các path bên dưới map trực tiếp từ root
    [ApiController]
    [Route("")]
    public class DashBoardController : ControllerBase
    {
        private readonly IUserServices _userServices;
        private readonly IOrderService _orderService;
        private readonly IProductServices _productServices;

        public DashBoardController(
            IUserServices userServices,
            IOrderService orderService,
            IProductServices productServices)
        {
            _userServices = userServices;
            _orderService = orderService;
            _productServices = productServices;
        }

        // GET /users
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
        {
            var users = await _userServices.GetAllUsersAsync(pageIndex, pageSize);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        // GET /users/customers
        [HttpGet("users/customers")]
        public async Task<IActionResult> GetAllCustomers([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
        {
            var users = await _userServices.GetAllCustomerAsync(pageIndex, pageSize);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        // GET /users/artisans
        [HttpGet("users/artisans")]
        public async Task<IActionResult> GetAllArtisans([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
        {
            var users = await _userServices.GetAllArtisanAsync(pageIndex, pageSize);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        // PUT /users?userId=xxx
        [HttpPut("users")]
        public async Task<IActionResult> UpdateUsers([FromQuery] string userId, [FromBody] RequestAdminUpdateUser request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var users = await _userServices.UpdateUserAsync(userId, request);

            return Ok(users);
        }

        // GET /newest-orders
        [HttpGet("newest-orders")]
        public async Task<IActionResult> GetNewestOrders()
        {
            var users = await _orderService.GetNewestOrderAsync();
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        // GET /products-dashboard
        [HttpGet("products-dashboard")]
        public async Task<IActionResult> GetAllProductsByUserId([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var users = await _productServices.GetProductsDashboardByUserIdAsync(userId, pageIndex, pageSize);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        // GET /top-products
        [HttpGet("top-products")]
        public async Task<IActionResult> GetTopProductsOrders()
        {
            var users = await _productServices.GetTop10ProductsAsync();
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        // GET /admin/monthly-revenue?year=2025
        [HttpGet("admin/monthly-revenue")]
        public async Task<IActionResult> GetAdminMonthlyRevenue([FromQuery] int year)
        {
            var revenues = await _orderService.GetAdminRevenuePerMonthAllOrderAsync(year);
            if (revenues == null)
            {
                return NotFound();
            }

            return Ok(revenues);
        }

        // GET /admin/weekly-revenue?year=2025&month=11
        [HttpGet("admin/weekly-revenue")]
        public async Task<IActionResult> GetAdminWeeklyRevenue([FromQuery] int year, [FromQuery] int month)
        {
            var revenues = await _orderService.GetAdminRevenuePerWeekAllOrderAsync(year, month);
            if (revenues == null)
            {
                return NotFound();
            }

            return Ok(revenues);
        }

        // GET /artisan/monthly-revenue?year=2025
        [HttpGet("artisan/monthly-revenue")]
        public async Task<IActionResult> GetArtisanMonthlyRevenue([FromQuery] int year)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var revenues = await _orderService.GetArtisanRevenuePerMonthAllOrderAsync(userId, year);
            if (revenues == null)
            {
                return NotFound();
            }

            return Ok(revenues);
        }

        // GET /artisan/weekly-revenue?year=2025&month=11
        [HttpGet("artisan/weekly-revenue")]
        public async Task<IActionResult> GetArtisanWeeklyRevenue([FromQuery] int year, [FromQuery] int month)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var revenues = await _orderService.GetArtisanRevenuePerWeekAllOrderAsync(userId, year, month);
            if (revenues == null)
            {
                return NotFound();
            }

            return Ok(revenues);
        }

        private bool TryGetUserId(out string userId)
        {
            userId = User.GetUserId() ?? string.Empty;
            return !string.IsNullOrWhiteSpace(userId);
        }
    }
}
