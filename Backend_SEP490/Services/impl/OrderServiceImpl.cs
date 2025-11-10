using AutoMapper;
using System.Linq;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Repositories.impl;

namespace Backend_SEP490.Services.impl;

public class OrderServiceImpl : GenericServices, IOrderService
{
    public OrderServiceImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
    {
    }

    private static string GenerateId(string prefix) => $"{prefix}-{DateTime.UtcNow:yyyyMMdd-HHmmssfff}";

    public async Task<string> CreateOrderAsync(string? userId, RequestCreateOrder request)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return "Create order failed!";
        }

        await using var transaction = await _context.BeginTransactionAsync();

        try
        {
            var cart = await _context.Cart.GetAllCartItemsAsync(userId);
            if (cart == null)
            {
                await transaction.RollbackAsync();
                return "Create order failed!";
            }

            var cartItems = (await _context.CartItem.GetAllCartitemByCartIdAsync(cart.Id)).ToList();
            if (cartItems.Count == 0)
            {
                await transaction.RollbackAsync();
                return "Create order failed!";
            }

            var orderId = $"Order-{userId}-{Guid.NewGuid():N}";
            var order = new Order
            {
                Id = orderId,
                OrderNumber = GenerateId("ORDER"),
                CustomerId = userId,
                Status = "Pending",
                TotalAmount = cartItems.Sum(item => (item.PriceAtAdd ?? 0m) * (item.Quantity ?? 0)),
                ShipingAddressId = request.ShipingAddressId,
                CreateAt = DateTime.UtcNow,
            };

            var addOrderStatus = await _context.Order.CreateOrderAsync(order);
            if (!addOrderStatus)
            {
                await transaction.RollbackAsync();
                return "Create order failed!";
            }

            var orderItems = cartItems
                .Select(item => new OrderItem
                {
                    Id = $"{orderId}-{item.ProductId}",
                    OrderID = orderId,
                    ProductID = item.ProductId,
                    Quantity = item.Quantity ?? 0,
                    UnitPrice = item.PriceAtAdd ?? 0m
                })
                .ToList();

            var addOrderItemStatus = await _context.OrderDetail.CreateOrderItemAsync(orderItems);
            if (!addOrderItemStatus)
            {
                await transaction.RollbackAsync();
                return "Create order item failed!";
            }

            await transaction.CommitAsync();
            return "Create order successfully!";
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<ResponseDTOOrder?> GetOrderByIdAsync(string orderId, int pageIndex, int pageSize)
    {
        if (pageIndex < 1)
        {
            pageIndex = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 10;
        }

        var order = await _context.Order.GetAllOrderByIdAsync(orderId);
        if (order == null)
        {
            return null;
        }

        var orderDetail = _mapper.Map<ResponseDTOOrder>(order);
        orderDetail.Items ??= new List<ResponseDTOOrderItem>();
        orderDetail.Items = orderDetail.Items
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return orderDetail;
    }

    public async Task<IEnumerable<ResponseDTOOrder>> GetAllOrderByUserIdAsync(string? userId, RequestFilterOrder? requestFilter)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Enumerable.Empty<ResponseDTOOrder>();
        }

        var orders = await _context.Order.GetAllOrderByUserIdAsync(userId);

        if (requestFilter != null)
        {
            if (!string.IsNullOrWhiteSpace(requestFilter.search))
            {
                orders = orders.Where(o =>
                    o.OrderNumber != null &&
                    o.OrderNumber.Contains(requestFilter.search, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(requestFilter.Status))
            {
                orders = orders.Where(o =>
                    o.Status != null &&
                    string.Equals(o.Status, requestFilter.Status, StringComparison.OrdinalIgnoreCase));
            }

            if (requestFilter.CreateAt.HasValue)
            {
                var targetDate = requestFilter.CreateAt.Value.Date;
                orders = orders.Where(o => o.CreateAt.Date == targetDate);
            }
        }

        return _mapper.Map<IEnumerable<ResponseDTOOrder>>(orders);
    }
}
