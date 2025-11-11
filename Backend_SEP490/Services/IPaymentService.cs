using Backend_SEP490.DTOs.Request;

namespace Backend_SEP490.Services;

public interface IPaymentService
{
    Task<string> UpdatePaymentStatusAsync(UpdatePaymentStatusRequest request);
}
