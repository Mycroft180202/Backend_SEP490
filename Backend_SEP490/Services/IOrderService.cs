using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Services
{
    public interface IOrderService
    {
        Task<PagedResult<ResponseDTOOrder>> GetAllOrderByUserIdAsync(string? userId, RequestFilterOrder? requestFilter);
        Task<ResponseDTOOrder?> GetOrderByIdAsync(string orderId);
        Task<CreateOrderResult> CreateOrderAsync(string? userId, RequestCreateOrder request);
        Task<string> CancelOrderAsync(string? userId, string orderId, RequestCancelOrder? request);
        Task<Order?> GetOrderByNumberForUserAsync(string? userId, string? orderNumber);
        Task<bool> CreateShipmentsAfterPaymentAsync(string orderId);
        Task<PagedResult<ResponseDTOOrder>> GetOrdersPagedAsync(int pageIndex, int pageSize, string? paymentStatus);
        Task<IEnumerable<ResponseDTOOrder>> GetNewestOrderAsync(string userId);
        Task<PagedResult<ResponseDTOOrder>> GetAllOrderByArtisanIdAsync(string userId, int pageIndex, int pageSize);
        Task<ResponseDTOTodayRevenue> GetAdminTodayRevenueAsync();
        Task<IEnumerable<ResponseDTOMonthRevenue>> GetAdminRevenuePerMonthAllOrderAsync(int year);
        Task<ResponseDTOTodayRevenue> GetArtisanTodayRevenueAsync(string? userId);
        Task<IEnumerable<ResponseDTOMonthRevenue>> GetArtisanRevenuePerMonthAllOrderAsync(string? userId, int year);
    }
}
