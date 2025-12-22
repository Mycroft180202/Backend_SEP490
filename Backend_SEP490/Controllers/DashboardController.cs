using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Extensions;
using Backend_SEP490.Services;
using ClosedXML.Excel;
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
        private readonly ISellerReputationService _sellerReputationService;


        public DashBoardController(
            IUserServices userServices,
            IOrderService orderService,
            IProductServices productServices,
            IReportService reportServices,
            ISellerReputationService sellerReputationService)
        {
            _userServices = userServices;
            _orderService = orderService;
            _productServices = productServices;
            _reportServices = reportServices;
            _sellerReputationService = sellerReputationService;
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
        public async Task<IActionResult> GetAllArtisans([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10, [FromQuery] int? year = null, [FromQuery] int? month = null)
        {
            var users = await _userServices.GetAllArtisanAsync(pageIndex, pageSize, year, month);
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
        [Authorize(Roles = "Artisan")]
        [HttpGet("newest-orders")]
        public async Task<IActionResult> GetNewestOrders()
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }
            var users = await _orderService.GetNewestOrderAsync(userId);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        // GET /artisan/orders
        [Authorize(Roles = "Artisan")]
        [HttpGet("artisan/orders")]
        public async Task<IActionResult> GetArtisanOrders([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }
            var users = await _orderService.GetAllOrderByArtisanIdAsync(userId, pageIndex, pageSize);
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

        // GET /admin/artisan-revenue-report?year=2025&month=12&artisanIds=U01,U02
        [Authorize(Roles = "Admin")]
        [HttpGet("admin/artisan-revenue-report")]
        public async Task<IActionResult> ExportArtisanRevenueReport(
            [FromQuery] int year,
            [FromQuery] int month,
            [FromQuery] string? artisanIds = null)
        {
            if (year <= 0)
            {
                return BadRequest("year is required.");
            }

            if (month < 1 || month > 12)
            {
                return BadRequest("month must be between 1 and 12.");
            }

            var normalizedIds = string.IsNullOrWhiteSpace(artisanIds)
                ? new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                : artisanIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var usersPage = await _userServices.GetAllArtisanAsync(1, int.MaxValue, year, month);
            var artisans = usersPage?.Items?.ToList() ?? new List<Backend_SEP490.DTOs.Response.ResponseDTOUserShopDashboard>();

            if (normalizedIds.Count > 0)
            {
                artisans = artisans
                    .Where(a => !string.IsNullOrWhiteSpace(a.UserID) && normalizedIds.Contains(a.UserID))
                    .ToList();
            }

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("ArtisanRevenue");

            worksheet.Cell(1, 1).Value = "Ten nghe nhan";
            worksheet.Cell(1, 2).Value = "Cua hang";
            worksheet.Cell(1, 3).Value = "Lien he";
            worksheet.Cell(1, 4).Value = $"Doanh thu ({month:00}/{year})";

            var header = worksheet.Range(1, 1, 1, 4);
            header.Style.Font.Bold = true;
            header.Style.Fill.BackgroundColor = XLColor.FromHtml("#F3F4F6");
            header.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            var row = 2;
            foreach (var artisan in artisans.OrderBy(a => a.ShopName ?? a.DisplayName ?? a.UserID, StringComparer.OrdinalIgnoreCase))
            {
                worksheet.Cell(row, 1).Value = artisan.DisplayName ?? string.Empty;
                worksheet.Cell(row, 2).Value = artisan.ShopName ?? artisan.DisplayName ?? string.Empty;
                worksheet.Cell(row, 3).Value = artisan.PhoneNumber ?? string.Empty;
                worksheet.Cell(row, 4).Value = artisan.TotalRevenue ?? 0m;
                worksheet.Cell(row, 4).Style.NumberFormat.Format = "#,##0";
                row++;
            }

            worksheet.Columns().AdjustToContents();

            await using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            var fileName = $"BaoCaoDoanhThuNgheNhan_{month:00}_{year}.xlsx";
            return File(
                stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
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
        [HttpGet("artisan/product/out-stock")]
        public async Task<IActionResult> GetOutOfStockProductNumberByArtisanId()
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var revenues = await _productServices.GetProductsOutOfStockNumberByArtisanIdAsync(userId);
            if (revenues == null)
            {
                return NotFound();
            }
            return Ok(revenues);
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



        [Authorize(Roles = "Artisan")]
        [HttpGet("artisan/product/top-product/revenue")]
        public async Task<IActionResult> GetTopProductByRevenue([FromQuery] int? year = 0,[FromQuery] int? month = 0)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var users = await _productServices.GetTopProductsByRevenueAsync(userId, year, month);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        [Authorize(Roles = "Artisan")]
        [HttpGet("artisan/product/top-product/total-sold")]
        public async Task<IActionResult> GetTopProductByToTalSold([FromQuery] int? year = 0,[FromQuery] int? month = 0)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var users = await _productServices.GetTopProductsByTotalSoldAsync(userId, year, month);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }
        [Authorize(Roles = "Artisan")]
        [HttpGet("artisan/revenue-percentage")]
        public async Task<IActionResult> GetArtisanRevenuePrecentageInMonth([FromQuery] int? year = 0, [FromQuery] int? month = 0)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var users = await _orderService.GetArtisanRevenuePrecentageInMonthAsync(userId, year, month);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }
        [Authorize(Roles = "Admin")]
        [HttpGet("admin/revenue-percentage")]
        public async Task<IActionResult> GetAdminRevenuePrecentageInMonth([FromQuery] int? year = 0, [FromQuery] int? month = 0)
        {
            var users = await _orderService.GetAdminRevenuePrecentageInMonthAsync(year, month);
            if (users == null)
            {
                return NotFound();
            }

            return Ok(users);
        }

        [Authorize(Roles = "Artisan")]
        [HttpGet("artisan/reputation/history")]
        public async Task<IActionResult> GetReputationHistory([FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 10)
        {
            if (!TryGetUserId(out var userId))
            {
                return Unauthorized();
            }

            var history = await _sellerReputationService.GetHistoryAsync(userId, pageIndex, pageSize, HttpContext.RequestAborted);
            return Ok(history);
        }

        private bool TryGetUserId(out string userId)
        {
            userId = User.GetUserId() ?? string.Empty;
            return !string.IsNullOrWhiteSpace(userId);
        }
    }
}
