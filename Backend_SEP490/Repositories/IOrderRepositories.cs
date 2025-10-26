using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IOrderRepositories
    {
        public Task<IEnumerable<Order>> GetAllOrderByUserIdAsync(string userId);
        public Task<Order> GetAllOrderByIdAsync(string orderId);
        public Task<bool> CreateOrderAsync(Order order);
    }
}
