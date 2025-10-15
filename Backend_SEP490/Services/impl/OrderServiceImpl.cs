using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl
{
    public class OrderServiceImpl : GenericServices, IOrderService
    {
        public OrderServiceImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
        {
        }
        public Task CreateOrderAsync(Order order)
        {
            throw new NotImplementedException();
        }

        public async Task<ResponseDTOOrder> GetAllOrderByIdAsync(string orderId)
        {
            var order = await _context.Order.GetAllOrderByIdAsync(orderId);

            return _mapper.Map<ResponseDTOOrder>(order);
        }

        public async Task<IEnumerable<ResponseDTOOrder>> GetAllOrderByUserIdAsync(string? userId, RequestFilterOrder? requestFilter)
        {
            var orders = await _context.Order.GetAllOrderByUserIdAsync(userId);

            if(string.IsNullOrEmpty(requestFilter.search))
            {
                orders = orders.Where(o => o.OrderNumber.Contains(requestFilter.search));
            }

            if (string.IsNullOrEmpty(requestFilter.Status))
            {
                orders = orders.Where(o => o.Status.Equals(requestFilter.Status));
            }

            if(requestFilter.CreateAt != null)
            {
                orders = orders.Where(o => o.CreateAt.Equals(requestFilter.CreateAt));
            }
            return _mapper.Map<IEnumerable<ResponseDTOOrder>>(orders);
        }

        
    }
}
