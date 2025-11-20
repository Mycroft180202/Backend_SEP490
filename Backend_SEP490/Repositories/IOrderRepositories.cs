using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IOrderRepositories
    {
        public Task<IEnumerable<Order>> GetAllOrderByUserIdAsync(string userId);
        public Task<Order> GetAllOrderByIdAsync(string orderId);
        public Task<bool> CreateOrderAsync(Order order);
        public Task<List<Order>> GetPendingOrdersBeforeAsync(DateTime thresholdUtc);
        public void RemoveRange(IEnumerable<Order> orders);
        public Task<(IEnumerable<Order> Items, int TotalCount)> GetPagedOrdersAsync(int pageIndex, int pageSize, string? paymentStatus);
    }
}
