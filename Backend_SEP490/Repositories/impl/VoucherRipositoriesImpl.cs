using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl
{
    public class VoucherRipositoriesImpl : GenericRepositoryImpl<Voucher>, IVoucherRepositories
    {
        public VoucherRipositoriesImpl(AppDbContext context) : base(context)
        {
        }

        public async Task<bool> CreateVoucherAsync(Voucher voucher)
        {
            try
            {
                _context.Vouchers.Add(voucher);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return false;
            }

            return true;
        }

        public async Task<bool> DeleteVoucherAsync(Voucher voucher)
        {
            try
            {
                _context.Vouchers.Remove(voucher);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return false;
            }

            return true;
        }

        public async Task<List<Voucher>> GetAllVoucherAsync()
        {
            return await _context.Vouchers.ToListAsync();
        }

        public async Task<Voucher> GetVoucherByCodeAsync(string code)
        {
            return await _context.Vouchers.Where( v => v.Code.Equals(code) ).FirstOrDefaultAsync();
        }

        public async Task<Voucher> GetVoucherByIdAsync(string voucherId)
        {
            return await _context.Vouchers.Where( v => v.VoucherId.Equals(voucherId) ).FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateVoucherAsync(Voucher voucher, RequestUpdateVoucher request)
        {
            try
            {
                voucher.Code = request.Code;
                voucher.Description = request.Description;
                voucher.DiscountType = request.DiscountType;
                voucher.DiscountValue = request.DiscountValue;
                voucher.MinOrderAmount = request.MinOrderAmount;
                voucher.MaxDiscountAmount = request.MaxDiscountAmount;
                voucher.StartDate = request.StartDate;
                voucher.EndDate = request.EndDate;
                voucher.UsageLimit = request.UsageLimit;
                voucher.UsedCount = request.UsedCount;
                voucher.IsActive = request.IsActive;
                voucher.UpdatedDate = DateTime.UtcNow;
            }
            catch (Exception ex) 
            {
                return false;
            }
            try
            {
                _context.Vouchers.Update(voucher);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return false;
            }

            return true;
        }
    }
}
