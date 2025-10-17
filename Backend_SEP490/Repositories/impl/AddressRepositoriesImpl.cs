using Backend_SEP490.DTOs.Request;
using Backend_SEP490.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_SEP490.Repositories.impl
{
    public class AddressRepositoriesImpl : GenericRepositoryImpl<Address>, IAddressRepositories
    {
        public AddressRepositoriesImpl(AppDbContext context) : base(context)
        {
        }

        public async Task<bool> CreateAddressAsync(Address address)
        {
            try
            {
                _context.Addresses.Add(address);
                _context.SaveChanges();

            }
            catch (Exception ex)
            {
                return false;
            }
            return true;
        }

        public async Task<bool> DeleteAddressAsync(Address address)
        {
            try
            {
                _context.Remove(address);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return false;
            }
            return true;
        }

        public async Task<Address> GetAddressByIdAsync(string addressId)
        {
            return await _context.Addresses.Where(a => a.Id.Equals(addressId)).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Address>> GetAllAddressByUserIdAsync(string userId)
        {
            return await _context.Addresses.Where(a => a.UserID == userId).ToListAsync();
        }

        public async Task<bool> UpdateAddressAsync(Address address, RequestCreateAndUpdateAddress request)
        {
            try
            {
                address.Line1 = request.Line1;
                address.Line2 = request.Line2;
                address.IsDefault = request.IsDefault;
                address.City = request.City;
                address.Country = request.Country;
                address.PosttalCode = request.PosttalCode;
            }
            catch (Exception ex)
            {
                return false;
            }

            try
            {
                _context.Addresses.Update(address);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return false;
            }
            return true;
        }
    }
}
