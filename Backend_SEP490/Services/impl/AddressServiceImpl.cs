using AutoMapper;
using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;
using Backend_SEP490.Repositories;

namespace Backend_SEP490.Services.impl
{
    public class AddressServiceImpl : GenericServices, IAddressService
    {
        public AddressServiceImpl(IMapper mapper, IUnitOfWork unitOfWork) : base(mapper, unitOfWork)
        {
        }

        public async Task<bool> CreateUserAddressAsync(string userId, RequestCreateAndUpdateAddress request)
        {
            string AddressId = "ADR-" + userId + "-" + DateTime.Now;

            var newAddress = new Address 
            {
                Id = AddressId,
                UserID = userId,
                Line1 = request.Line1,
                Line2 = request.Line2,
                City = request.City,
                PosttalCode = request.PosttalCode,
                Country = request.Country,
                IsDefault = request.IsDefault
            };

            var status = await _context.Address.CreateAddressAsync(newAddress);
            return status;
        }

        public async Task<bool> DeleteUserAddressAsync(string addressId)
        {
            var address = await _context.Address.GetAddressByIdAsync(addressId);
            if (address == null) return false;

            var status = await _context.Address.DeleteAddressAsync(address);
            return status;
        }

        public async Task<IEnumerable<ResponseDTOAddress>> GetAllAddressByUserIdAsync(string userId)
        {
            var address = await _context.Address.GetAllAddressByUserIdAsync(userId);
            return _mapper.Map<IEnumerable<ResponseDTOAddress>>(address);
        }

        public async Task<bool> UpdateUserAddressAsync(string addressId, RequestCreateAndUpdateAddress request)
        {
            var address = await _context.Address.GetAddressByIdAsync(addressId);
            if (address == null) return false;

            var status = await _context.Address.UpdateAddressAsync(address, request);
            return status;
        }
    }
}
