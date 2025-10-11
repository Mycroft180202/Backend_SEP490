using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using System.Runtime.CompilerServices;
using AutoMapper;

namespace Backend_SEP490.Mapper
{
    public class AddressMapper : Profile
    {
        public AddressMapper()
        {
            CreateMap<Address, ResponseDTOAddress>().ReverseMap();
        }
    }
}
