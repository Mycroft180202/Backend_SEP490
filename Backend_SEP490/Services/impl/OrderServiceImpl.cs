using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Repositories.impl;

namespace Backend_SEP490.Services.impl
{
    public class OrderServiceImpl : GenericServices, IOrderService
    {
        public OrderServiceImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
        {
        }

        private string GenerateID(string prefix) => $"{prefix}-{DateTime.UtcNow:yyyyMMdd-HHmmss}";
        public async Task<bool> CreateOrderAsync(string userId, RequestCreateOrder request)
        {
            await using var transaction = await _context.BeginTransactionAsync();

            var cart = await _context.Cart.GetAllCartItemsAsync(userId);
            var cartItems = await _context.CartItem.GetAllCartitemByCartIdAsync(cart.Id);


            decimal totalAmount = 0;
            foreach (var item in cartItems)
            {
                totalAmount = (decimal)(item.PriceAtAdd * item.Quantity) + totalAmount;
            }
            string orderId = "Order-" + userId + totalAmount + DateTime.UtcNow;
            Order order = new Order
            {
                Id = orderId,
                OrderNumber = GenerateID("ORDER"),
                Status = "Pending",
                TotalAmount = totalAmount,
                ShipingAddressId = request.ShipingAddressId,
                CreateAt = DateTime.UtcNow,
            };
            var addOrderStatus = await _context.Order.CreateOrderAsync(order);
            if (!addOrderStatus)
            {
                await transaction.RollbackAsync();
                return false;
            }

            List<OrderItem> orderItems = new List<OrderItem>();
            foreach (var item in cartItems)
            {
                orderItems.Add(new OrderItem
                {
                    Id = orderId + item.ProductId,
                    OrderID = orderId,
                    ProductID = item.ProductId,
                    Quantity = (int)item.Quantity,
                    UnitPrice = (decimal)item.PriceAtAdd
                });
            }
            var addOrderItemStatus = await _context.OrderDetail.CreateOrderItemAsync(orderItems);
            if (!addOrderItemStatus)
            {
                await transaction.RollbackAsync();
                return false;
            }

            //Add Shipment (Đợi API bên thứ 3)



            return true;
        }

        public async Task<ResponseDTOOrder> GetOrderByIdAsync(string orderId, int pageIndex, int pageSize)
        {
            var order = await _context.Order.GetAllOrderByIdAsync(orderId);

            var orderDetail = _mapper.Map<ResponseDTOOrder>(order);
            orderDetail.Items = orderDetail.Items.Skip((pageIndex - 1) * pageSize).Take(pageSize).ToList();

            return orderDetail;
        }

        public async Task<IEnumerable<ResponseDTOOrder>> GetAllOrderByUserIdAsync(string? userId, RequestFilterOrder? requestFilter)
        {
            var orders = await _context.Order.GetAllOrderByUserIdAsync(userId);

            if (string.IsNullOrEmpty(requestFilter.search))
            {
                orders = orders.Where(o => o.OrderNumber.Contains(requestFilter.search));
            }

            if (string.IsNullOrEmpty(requestFilter.Status))
            {
                orders = orders.Where(o => o.Status.Equals(requestFilter.Status));
            }

            if (requestFilter.CreateAt != null)
            {
                orders = orders.Where(o => o.CreateAt.Equals(requestFilter.CreateAt));
            }
            return _mapper.Map<IEnumerable<ResponseDTOOrder>>(orders);
        }


    }
}
