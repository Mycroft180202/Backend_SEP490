using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IOrderRepositories
    {
        public Task<IEnumerable<Order>> GetAllOrderByUserIdAsync(string userId);
        public Task<IEnumerable<Order>> GetAllOrderByArtisanIdAsync(string userId);
        public Task<Order> GetAllOrderByIdAsync(string orderId);
        public Task<bool> CreateOrderAsync(Order order);
        public Task<List<Order>> GetPendingOrdersBeforeAsync(DateTime thresholdUtc);
        public void RemoveRange(IEnumerable<Order> orders);
        public Task<(IEnumerable<Order> Items, int TotalCount)> GetPagedOrdersAsync(int pageIndex, int pageSize, string? paymentStatus);
        public Task<IEnumerable<Order>> GetNewestOrderAsync();
        public Task<IEnumerable<Order>> GetAllOrderAsync();
        public Task<Order> GetAllOrderByNumberAsync(string orderId);
    }
}
