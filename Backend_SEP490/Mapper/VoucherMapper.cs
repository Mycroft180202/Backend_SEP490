using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Mapper
{
    public class VoucherMapper: Profile
    {
        public VoucherMapper() 
        {
            CreateMap<Voucher, ResponseDTOVoucher>().ReverseMap();
        }
    }
}
