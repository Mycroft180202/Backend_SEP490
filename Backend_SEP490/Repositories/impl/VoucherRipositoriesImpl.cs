using System;
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

        public async Task<string> CreateVoucherAsync(Voucher voucher)
        {
            try
            {
                _context.Vouchers.Add(voucher);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return "Create voucher failed!";
            }

            return "Create voucher successfully!";
        }

        public async Task<string> DeleteVoucherAsync(Voucher voucher)
        {
            try
            {
                _context.Vouchers.Remove(voucher);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return "Delete voucher failed!";
            }

            return "Delete voucher successfully!";
        }

        public async Task<List<Voucher>> GetAllVoucherAsync()
        {
            return await _context.Vouchers.ToListAsync();
        }

        public async Task<Voucher> GetVoucherByCodeAsync(string code)
        {
            return await _context.Vouchers.Where( v => v.Code.Equals(code) ).FirstOrDefaultAsync();
        }

        public async Task<Voucher> GetVoucherByIdAsync(int voucherId)
        {
            return await _context.Vouchers.Where( v => v.VoucherId.Equals(voucherId) ).FirstOrDefaultAsync();
        }

        public async Task<string> UpdateVoucherAsync(Voucher voucher, RequestUpdateVoucher request)
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
                voucher.IsShared = request.IsShared;
                voucher.OwnerUserId = request.OwnerUserId;
                voucher.SingleUse = request.SingleUse;
                voucher.Source = request.Source;
                voucher.UpdatedDate = DateTime.UtcNow;
            }
            catch (Exception ex) 
            {
                return "Update voucher information failed!";
            }
            try
            {
                _context.Vouchers.Update(voucher);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return "Update voucher failed!";
            }

            return "Update voucher successfully!";
        }

        public async Task<List<Voucher>> GetActiveSharedVouchersAsync(DateTime nowUtc)
        {
            return await _context.Vouchers
                .Where(v =>
                    v.IsShared &&
                    v.IsActive &&
                    v.StartDate <= nowUtc &&
                    v.EndDate >= nowUtc &&
                    (!v.UsageLimit.HasValue || v.UsedCount < v.UsageLimit.Value))
                .OrderBy(v => v.EndDate)
                .ToListAsync();
        }

        public async Task<List<Voucher>> GetActivePersonalVouchersAsync(string userId, DateTime nowUtc)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return new List<Voucher>();
            }

            return await _context.Vouchers
                .Where(v =>
                    !v.IsShared &&
                    v.OwnerUserId == userId &&
                    v.IsActive &&
                    v.StartDate <= nowUtc &&
                    v.EndDate >= nowUtc &&
                    (!v.UsageLimit.HasValue || v.UsedCount < v.UsageLimit.Value))
                .OrderBy(v => v.EndDate)
                .ToListAsync();
        }

        public async Task<Voucher?> GetBySourceAsync(string? source)
        {
            if (string.IsNullOrWhiteSpace(source))
            {
                return null;
            }

            return await _context.Vouchers.FirstOrDefaultAsync(v => v.Source == source);
        }

        public async Task<List<string>> GetSourcesByPrefixAsync(string prefix)
        {
            if (string.IsNullOrWhiteSpace(prefix))
            {
                return new List<string>();
            }

            return await _context.Vouchers
                .Where(v => v.Source != null && v.Source.StartsWith(prefix))
                .Select(v => v.Source!)
                .Distinct()
                .ToListAsync();
        }

        public async Task<List<Voucher>> GetExpiringSharedVouchersAsync(DateTime fromUtc, DateTime toUtc)
        {
            return await _context.Vouchers
                .Where(v =>
                    v.IsShared &&
                    v.IsActive &&
                    v.EndDate >= fromUtc &&
                    v.EndDate <= toUtc &&
                    v.IsAutoGenerated)
                .ToListAsync();
        }
    }
}
