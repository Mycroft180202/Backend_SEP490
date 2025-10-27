using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IVoucherRepositories
    {
        public Task<List<Voucher>> GetAllVoucherAsync();
        public Task<Voucher> GetVoucherByIdAsync(string voucherId);
        public Task<Voucher> GetVoucherByCodeAsync(string code);
        public Task<bool> CreateVoucherAsync(Voucher voucher);
        public Task<bool> UpdateVoucherAsync(Voucher voucher, RequestUpdateVoucher request);
        public Task<bool> DeleteVoucherAsync(Voucher voucher);
    }
}
