using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;

namespace Backend_SEP490.Services.impl;

public class PaymentServiceImpl : GenericServices, IPaymentService
{
    private readonly INotificationService _notificationService;

    public PaymentServiceImpl(
        IMapper mapper,
        IUnitOfWork unitOfWork,
        INotificationService notificationService) : base(mapper, unitOfWork)
    {
        _notificationService = notificationService;
    }

    public async Task<string> UpdatePaymentStatusAsync(UpdatePaymentStatusRequest request)
    {
        var payment = await _context.Payments.FindByIdAsync(request.PaymentId);
        if (payment == null)
        {
            return "Payment not found!";
        }

        payment.PaymentStatus = request.Status;
        payment.ProccessedAt = DateTime.UtcNow;
        _context.Payments.Update(payment);
        await _context.SaveChangesAsync();

        var order = await _context.Order.GetAllOrderByIdAsync(payment.OrderID);
        var customerId = order?.CustomerId;
        var orderNumber = order?.OrderNumber;

        if (!string.IsNullOrWhiteSpace(customerId))
        {
            await _notificationService.NotifyPaymentStatusAsync(payment, customerId!, orderNumber);
        }

        return "Payment status updated successfully!";
    }
}
