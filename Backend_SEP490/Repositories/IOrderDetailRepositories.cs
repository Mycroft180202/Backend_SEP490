using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IOrderDetailRepositories
    {
        public Task<bool> CreateOrderItemAsync(List<OrderItem> list);
        public Task<List<OrderItem>> GetAllOrderItemAsync(string orderId);
    }
}
