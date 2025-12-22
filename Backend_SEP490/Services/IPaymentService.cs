using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Microsoft.AspNetCore.Http;

namespace Backend_SEP490.Services;

public interface IPaymentService
{
    Task<VnpayPaymentResponse?> CreateVnpayPaymentAsync(string userId, CreateVnpayPaymentRequest request, string clientIp);
    Task<VnpayCallbackResult> HandleVnpayCallbackAsync(IQueryCollection queryCollection);
    Task<string> UpdatePaymentStatusAsync(UpdatePaymentStatusRequest request);
}
