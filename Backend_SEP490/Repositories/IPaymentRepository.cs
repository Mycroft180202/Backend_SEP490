using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories;

public interface IPaymentRepository : IGenericRepository<Payment>
{
    Task<List<Payment>> GetByOrderIdAsync(string orderId);
    Task<Payment?> FindByIdAsync(string paymentId);
}
