using AutoMapper;
using Backend_SEP490.Data;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;
using Backend_SEP490.Services;

namespace Backend_SEP490.Services.impl
{
    public class VoucherServiceImpl : GenericServices, IVoucherService
    {
        private readonly INotificationService _notificationService;

        public VoucherServiceImpl(IMapper mapper, IUnitOfWork unitOfWork, INotificationService notificationService) : base(mapper, unitOfWork)
        {
            _notificationService = notificationService;
        }

        public async Task<string> CreateVoucherAsync(string userId, RequestCreateVoucher request)
        {
            var isExist = await _context.Voucher.GetVoucherByCodeAsync(request.Code);
            if (isExist != null) return "Voucher Code is already exist!";
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
            if (status.Contains("success", StringComparison.OrdinalIgnoreCase))
            {
                await _notificationService.NotifyPromotionAsync(voucher);
            }
            return status;
        }

        public async Task<string> DeleteVoucherAsync(string voucherId)
        {
           var voucher = await _context.Voucher.GetVoucherByIdAsync(voucherId);
            if (voucher == null)
            {
                return "Voucher not found!";
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

        public async Task<string> UpdateVoucherAsync(string voucherId, RequestUpdateVoucher request)
        {
            var voucher = await _context.Voucher.GetVoucherByIdAsync(voucherId);
            if (voucher == null) return "Voucher not found!";
            return await _context.Voucher.UpdateVoucherAsync(voucher, request);
        }
    }
}
