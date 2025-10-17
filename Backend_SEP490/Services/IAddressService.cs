using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services
{
    public interface IAddressService
    {
        public Task<IEnumerable<ResponseDTOAddress>> GetAllAddressByUserIdAsync(string userId);
        public Task<bool> CreateUserAddressAsync(string userId, RequestCreateAndUpdateAddress request);
        public Task<bool> UpdateUserAddressAsync(string addressId, RequestCreateAndUpdateAddress request);
        public Task<bool> DeleteUserAddressAsync( string addressId);
    }
}
