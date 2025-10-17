using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IAddressRepositories
    {
        public Task<IEnumerable<Address>> GetAllAddressByUserIdAsync(string userId);
        public Task<Address> GetAddressByIdAsync(string addressId);
        public Task<bool> CreateAddressAsync(Address address);
        public Task<bool> UpdateAddressAsync(Address address, RequestCreateAndUpdateAddress request);
        public Task<bool> DeleteAddressAsync(Address address);
    }
}
