using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;

namespace Backend_SEP490.Repositories
{
    public interface IAddressRepositories
    {
        public Task<IEnumerable<Address>> GetAllAddressByUserIdAsync(string userId);
        public Task<Address> GetAddressByIdAsync(string addressId);
        public Task<string> CreateAddressAsync(Address address , Address defaulAddress);
        public Task<string> UpdateAddressAsync(Address address, RequestCreateAndUpdateAddress request, Address defaultAddress);
        public Task<string> DeleteAddressAsync(Address address);
        public Task<Address> GetDefaultAddressAsync();
    }
}
