using System.Threading;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services
{
    public interface IVoucherService
    {
        Task<PagedResult<ResponseDTOVoucher>> GetAllVoucherAsync(int pageIndex, int pageSize);
        Task<ResponseDTOVoucher> GetVoucherByIdAsync(int voucherId);
        Task<ResponseUserVoucherCollection> GetVoucherByUserIdAsync(string userId);
        Task<string> CreateVoucherAsync(string userId, RequestCreateVoucher request);
        Task<string> UpdateVoucherAsync(int voucherId, RequestUpdateVoucher request);
        Task<string> DeleteVoucherAsync(int voucherId);
        Task<Voucher?> CreateRefundVoucherAsync(string userId, Order order, decimal refundAmount, string? reason);
        Task<Voucher?> TryGrantLargeOrderVoucherAsync(Order order);
        Task RunAutomationJobsAsync(CancellationToken cancellationToken);
    }
}
