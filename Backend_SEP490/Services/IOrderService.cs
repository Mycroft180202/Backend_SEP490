using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Microsoft.AspNetCore.Mvc;

namespace Backend_SEP490.Services
{
    public interface IOrderService
    {
        public Task<IEnumerable<ResponseDTOOrder>> GetAllOrderByUserIdAsync(string? userId, RequestFilterOrder? requestFilter);
        public Task<ResponseDTOOrder> GetOrderByIdAsync(string orderId, int pageIndex, int pageSize);
        public Task<string> CreateOrderAsync(string userId, RequestCreateOrder request);
    }
}
