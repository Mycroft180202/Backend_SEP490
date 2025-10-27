using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl
{
    public class OrderDetailRepositoriesImpl : GenericRepositoryImpl<OrderItem>, IOrderDetailRepositories
    {
        public OrderDetailRepositoriesImpl(AppDbContext context) : base(context)
        {
        }

        public async Task<bool> CreateOrderItemAsync(List<OrderItem> list)
        {
            try
            {
                foreach (var item in list) 
                {
                    _context.OrderItems.Add(item);
                }
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return false;
            }
            return true;
        }

        public async Task<List<OrderItem>> GetAllOrderItemAsync(string orderId)
        {
            return await _context.OrderItems.Where(oi => oi.OrderID.Equals(orderId)).ToListAsync();
        }
    }
}
