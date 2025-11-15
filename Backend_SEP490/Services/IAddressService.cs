using Backend_SEP490.DTOs.Request;
using Backend_SEP490.DTOs.Response;
using Backend_SEP490.Models;

namespace Backend_SEP490.Services
{
    public interface IAddressService
    {
        public Task<IEnumerable<ResponseDTOAddress>> GetAllAddressByUserIdAsync(string userId);
        public Task<ResponseDTOAddress> GetAddressByIdAsync(string addressId);
        public Task<string> CreateUserAddressAsync(string userId, RequestCreateAndUpdateAddress request);
        public Task<string> UpdateUserAddressAsync(string addressId, RequestCreateAndUpdateAddress request, string userId);
        public Task<string> DeleteUserAddressAsync( string addressId);
    }
}
