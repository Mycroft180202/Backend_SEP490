using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IVoucherRepositories
    {
        Task<List<Voucher>> GetAllVoucherAsync();
        Task<Voucher> GetVoucherByIdAsync(int voucherId);
        Task<Voucher> GetVoucherByCodeAsync(string code);
        Task<string> CreateVoucherAsync(Voucher voucher);
        Task<string> UpdateVoucherAsync(Voucher voucher, RequestUpdateVoucher request);
        Task<string> DeleteVoucherAsync(Voucher voucher);
        Task<List<Voucher>> GetActiveSharedVouchersAsync(DateTime nowUtc);
        Task<List<Voucher>> GetActivePersonalVouchersAsync(string userId, DateTime nowUtc);
        Task<Voucher?> GetBySourceAsync(string? source);
        Task<List<string>> GetSourcesByPrefixAsync(string prefix);
        Task<List<Voucher>> GetExpiringSharedVouchersAsync(DateTime fromUtc, DateTime toUtc);
    }
}
