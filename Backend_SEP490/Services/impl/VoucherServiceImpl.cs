using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl
{
    public class VoucherServiceImpl : GenericServices, IVoucherService
    {
        public VoucherServiceImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
        {
        }

        public async Task<bool> CreateVoucherAsync(string userId, RequestCreateVoucher request)
        {
            var isExist = await _context.Voucher.GetVoucherByCodeAsync(request.Code);
            if (isExist != null) return false;
            Voucher voucher = new Voucher 
            {
                Code = request.Code,
                Description = request.Description,
                DiscountType = request.DiscountType,
                DiscountValue = request.DiscountValue,
                MinOrderAmount = request.MinOrderAmount,
                MaxDiscountAmount = request.MaxDiscountAmount,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                UsageLimit = request.UsageLimit,
                UsedCount = request.UsedCount,
                IsActive = request.IsActive,
                CreatedDate = DateTime.UtcNow,
                CreatedById = userId,
                UpdatedDate = DateTime.UtcNow,
            };

            var status = await _context.Voucher.CreateVoucherAsync(voucher);
            return status;
        }

        public async Task<bool> DeleteVoucherAsync(string voucherId)
        {
           var voucher = await _context.Voucher.GetVoucherByIdAsync(voucherId);
            if (voucher == null)
            {
                return false;
            }

            return await _context.Voucher.DeleteVoucherAsync(voucher);

        }

        public async Task<PagedResult<ResponseDTOVoucher>> GetAllVoucherAsync(int pageIndex, int pageSize)
        {
            var vouchers = await _context.Voucher.GetAllVoucherAsync();
            int totalCount = vouchers.Count();
            vouchers = vouchers.Skip((pageIndex -1) * pageSize).Take(pageSize).ToList();

            var vouchersList = _mapper.Map<List<ResponseDTOVoucher>>(vouchers);

                return new PagedResult<ResponseDTOVoucher>
                {
                    Items = vouchersList,
                    TotalCount = totalCount,
                    PageIndex = pageIndex,
                    PageSize = pageSize
                };
        }

        public async Task<ResponseDTOVoucher> GetVoucherByIdAsync(string voucherId)
        {
            var voucher = await _context.Voucher.GetVoucherByIdAsync(voucherId);
            return _mapper.Map<ResponseDTOVoucher>(voucher);
        }

        public async Task<bool> UpdateVoucherAsync(string voucherId, RequestUpdateVoucher request)
        {
            var voucher = await _context.Voucher.GetVoucherByIdAsync(voucherId);
            return await _context.Voucher.UpdateVoucherAsync(voucher, request);
        }
    }
}
