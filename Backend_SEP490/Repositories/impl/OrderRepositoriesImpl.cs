using System.Collections.Generic;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl
{
    public class OrderRepositoriesImpl : GenericRepositoryImpl<Order>, IOrderRepositories
    {
        public OrderRepositoriesImpl(AppDbContext context) : base(context)
        {
        }

        public async Task<bool> CreateOrderAsync(Order order)
        {
            try
            {
                _context.Orders.Add(order);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return false;
            }
            return true;
        }

        public async Task<Order> GetAllOrderByIdAsync(string orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.Shipments)
                .FirstOrDefaultAsync(o => o.Id.Equals(orderId));
            return order;
        }

        public async Task<IEnumerable<Order>> GetAllOrderByUserIdAsync(string userId)
        {
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.Shipments)
                .Where(o => o.CustomerId.Equals(userId))
                .ToListAsync();
            return orders;
        }

        public async Task<List<Order>> GetPendingOrdersBeforeAsync(DateTime thresholdUtc)
        {
            return await _context.Orders
                .Include(o => o.Payments)
                .Where(o =>
                    o.Status == "Pending" &&
                    o.CreateAt <= thresholdUtc)
                .ToListAsync();
        }

        public void RemoveRange(IEnumerable<Order> orders)
        {
            _context.Orders.RemoveRange(orders);
        }

    }
}
