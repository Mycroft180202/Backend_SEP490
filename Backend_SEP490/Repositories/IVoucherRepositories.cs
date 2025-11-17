using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IVoucherRepositories
    {
        public Task<List<Voucher>> GetAllVoucherAsync();
        public Task<Voucher> GetVoucherByIdAsync(int voucherId);
        public Task<Voucher> GetVoucherByCodeAsync(string code);
        public Task<string> CreateVoucherAsync(Voucher voucher);
        public Task<string> UpdateVoucherAsync(Voucher voucher, RequestUpdateVoucher request);
        public Task<string> DeleteVoucherAsync(Voucher voucher);
    }
}
