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
        private string GenerateID(string prefix) => $"{prefix}-{DateTime.UtcNow:yyyyMMdd-HHmmss}";
        public async Task<string> CreateUserAddressAsync(string userId, RequestCreateAndUpdateAddress request)
        {
            
            string AddressId = "ADR-" + userId + GenerateID("");
            var newAddress = new Address 
            {
                Id = AddressId,
                UserID = userId,
                Line1 = request.Line1,
                Line2 = request.Line2,
                City = request.City,
                PosttalCode = request.PosttalCode,
                Country = request.Country,
                IsDefault = request.IsDefault,
                ContactName = request.ContactName,
                ContactPhone = request.ContactPhone,
                GhnProvinceId = request.GhnProvinceId,
                GhnDistrictId = request.GhnDistrictId,
                GhnWardCode = request.GhnWardCode
            };

            
            //var addressList = await _context.Address.GetAllAddressByUserIdAsync(userId);
            //if (!addressList.Any()) newAddress.IsDefault = true;
            
            
            // Nếu như address mới người dùng để mặc định thì chuyển cả address đang là default thì false
            if (request.IsDefault) 
            {
                var defaultAddress = await _context.Address.GetDefaultAddressAsync(userId);
                return await _context.Address.CreateAddressAsync(newAddress, defaultAddress);

            }
            return await _context.Address.CreateAddressAsync(newAddress, null);
           
        }

        public async Task<string> DeleteUserAddressAsync(string addressId,string userId)
        {
            var address = await _context.Address.GetAddressByIdAsync(addressId);
            if (address == null) return "Address not found!";
           
            //Kiểm tra xem nếu như nó là default address thì phải chuyển nó sang address mới nhất làm default address
            var defaultAddress = await _context.Address.GetDefaultAddressAsync(userId);
            if(defaultAddress.Id.Equals(address.Id))
            {
                defaultAddress = await _context.Address.GetNewestAddressByUserIdAsync(userId);
                if(defaultAddress != null)
                {
                    var changeDefaultStatus = await _context.Address.UpdateAddressAsync(defaultAddress);
                    if (changeDefaultStatus) return "Update new default address failed!";
                }
               
            }

            return await _context.Address.DeleteAddressAsync(address);
        }

        public async Task<IEnumerable<ResponseDTOAddress>> GetAllAddressByUserIdAsync(string userId)
        {
            var address = await _context.Address.GetAllAddressByUserIdAsync(userId);
            return _mapper.Map<IEnumerable<ResponseDTOAddress>>(address);
        }

        public async Task<ResponseDTOAddress> GetAddressByIdAsync(string adressId)
        {
            var address = await _context.Address.GetAddressByIdAsync(adressId);
            return _mapper.Map<ResponseDTOAddress>(address);
        }
        public async Task<string> UpdateUserAddressAsync(string addressId, RequestCreateAndUpdateAddress request, string userId)
        {
            var address = await _context.Address.GetAddressByIdAsync(addressId);
            if (address == null) return "Address not found!";


            // Nếu như address này người dùng để thành mặc định thì chuyển cái đang là default thành false
            Address defaultAddress = null;
            if (request.IsDefault)
            {
                 defaultAddress = await _context.Address.GetDefaultAddressAsync(userId);
                if (defaultAddress.Id.Equals(addressId))
                {
                    defaultAddress = null;
                }
            }

            return await _context.Address.UpdateAddressAsync(address, request, defaultAddress);
        }
    }
}
