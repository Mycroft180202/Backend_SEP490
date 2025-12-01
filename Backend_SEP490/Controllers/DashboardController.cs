using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Controllers
{
    // Bỏ "api/[controller]" để các path bên dưới map trực tiếp từ root
    [ApiController]
    [Route("")]
    [Authorize]
    public class DashBoardController : ControllerBase
    {
        private readonly IUserServices _userServices;
        private readonly IOrderService _orderService;
        private readonly IProductServices _productServices;
        private readonly IReportService _reportServices;


        public DashBoardController(
            IUserServices userServices,
            IOrderService orderService,
            IProductServices productServices,
            IReportService reportServices)
        {
            _userServices = userServices;
            _orderService = orderService;
            _productServices = productServices;
            _reportServices = reportServices;
        }

        // GET /users
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
        [HttpPut("users")]
        public async Task<IActionResult> UpdateUsers([FromQuery] string userId, [FromBody] RequestAdminUpdateUser request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var users = await _userServices.UpdateUserAsync(userId, request);

            return Ok(users);
        }

        // GET /newest-orders
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Artisan")]
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
        [Authorize(Roles = "Admin")]
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

        // GET /admin/today-revenue
        [Authorize(Roles = "Admin")]
        [HttpGet("admin/today-revenue")]
        public async Task<IActionResult> GetAdminTodayRevenue()
        {
            var revenues = await _orderService.GetAdminTodayRevenueAsync();
            if (revenues == null)
            {
                return NotFound();
            }
            return Ok(revenues);
        }

        // GET /admin/monthly-revenue?year=2025
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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

        // GET /admin/report-number
        [Authorize(Roles = "Admin")]
        [HttpGet("admin/report-number")]
        public async Task<IActionResult> GetNeedActionReportNumberRevenue()
        {
            var number = await _reportServices.NewReportNumberAsync();
            if (number == null)
            {
                return NotFound();
            }
            return Ok(number);
        }
        
        // GET /artisan/today-revenue
        [Authorize(Roles = "Artisan")]
        [HttpGet("artisan/today-revenue")]
        public async Task<IActionResult> GetArtisanTodayRevenue()
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var revenues = await _orderService.GetArtisanTodayRevenueAsync(userId);
            if (revenues == null)
            {
                return NotFound();
            }
            return Ok(revenues);
        }

        // GET /artisan/monthly-revenue?year=2025
        [Authorize(Roles = "Artisan")]
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
        [Authorize(Roles = "Artisan")]
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
