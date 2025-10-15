using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl
{
    public class OrderRepositoriesImpl : GenericRepositoryImpl<Order>, IOrderRepositories
    {
        public OrderRepositoriesImpl(AppDbContext context) : base(context)
        {
        }

        public Task CreateOrderAsync(Order order)
        {
            throw new NotImplementedException();
        }

        public async Task<Order> GetAllOrderByIdAsync(string orderId)
        {
            var order = await _context.Orders.Where(o => o.Id == orderId).FirstOrDefaultAsync();
            return order;
        }

        public async Task<IEnumerable<Order>> GetAllOrderByUserIdAsync(string userId)
        {
            var orders = await _context.Orders.Where(o => o.CustomerId.Equals(userId)).ToListAsync();
            return orders;
        }
    }
}
