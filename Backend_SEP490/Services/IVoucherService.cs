using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services
{
    public interface IVoucherService
    {
        public Task<PagedResult<ResponseDTOVoucher>> GetAllVoucherAsync(int pageIndex, int pageSize);
        public Task<ResponseDTOVoucher> GetVoucherByIdAsync(int voucherId);
        public Task<string> CreateVoucherAsync(string userId,RequestCreateVoucher request);
        public Task<string> UpdateVoucherAsync(int voucherId, RequestUpdateVoucher request);
        public Task<string> DeleteVoucherAsync(int voucherId);
    }
}
