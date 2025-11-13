using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Services
{
    public interface IOrderService
    {
        Task<IEnumerable<ResponseDTOOrder>> GetAllOrderByUserIdAsync(string? userId, RequestFilterOrder? requestFilter);
        Task<ResponseDTOOrder?> GetOrderByIdAsync(string orderId, int pageIndex, int pageSize);
        Task<string> CreateOrderAsync(string? userId, RequestCreateOrder request);
        Task<string> CancelOrderAsync(string? userId, string orderId, RequestCancelOrder? request);
    }
}
