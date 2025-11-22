using System.Collections.Generic;
using System.Linq;
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

        public async Task<(IEnumerable<Order> Items, int TotalCount)> GetPagedOrdersAsync(int pageIndex, int pageSize, string? paymentStatus)
        {
            if (pageIndex < 1)
            {
                pageIndex = 1;
            }

            if (pageSize < 1)
            {
                pageSize = 10;
            }

            var query = _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.Shipments)
                .Include(o => o.Payments)
                .OrderByDescending(o => o.CreateAt)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(paymentStatus))
            {
                var normalized = paymentStatus.Trim().ToLowerInvariant();
                if (normalized == "paid")
                {
                    query = query.Where(o => o.Payments.Any(p => p.PaymentStatus != null && p.PaymentStatus.ToLower() == "paid"));
                }
                else if (normalized == "unpaid")
                {
                    query = query.Where(o => !o.Payments.Any(p => p.PaymentStatus != null && p.PaymentStatus.ToLower() == "paid"));
                }
            }

            var totalCount = await query.CountAsync();
            var orders = await query
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (orders, totalCount);
        }

        public async Task<IEnumerable<Order>> GetNewestOrderAsync()
        {
            var order = await _context.Orders.OrderByDescending( o=> o.CreateAt).Take(10)
                 .ToListAsync();
            return order;
        }

        public async Task<IEnumerable<Order>> GetAllOrderAsync()
        {
            var order = await _context.Orders.ToListAsync();
            return order;
        }

        public async Task<IEnumerable<Order>> GetAllOrderByArtisanIdAsync(string userId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(o => o.Product)
                .Where(o => o.OrderItems.Any(p => p.Product.ArtisanId.Equals(userId))).ToListAsync();
            return order;
        }
    }
}
