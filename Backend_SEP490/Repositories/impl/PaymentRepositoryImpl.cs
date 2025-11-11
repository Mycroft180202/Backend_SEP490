using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl;

public class PaymentRepositoryImpl : GenericRepositoryImpl<Payment>, IPaymentRepository
{
    public PaymentRepositoryImpl(AppDbContext context) : base(context)
    {
    }

    public async Task<List<Payment>> GetByOrderIdAsync(string orderId)
    {
        return await _context.Payments
            .Where(p => p.OrderID == orderId)
            .ToListAsync();
    }

    public async Task<Payment?> FindByIdAsync(string paymentId)
    {
        return await _context.Payments
            .FirstOrDefaultAsync(p => p.Id == paymentId);
    }
}
