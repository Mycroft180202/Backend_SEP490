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

        public async Task<string> CreateAddressAsync(Address address, Address defaultAddress)
        {
            try
            {
                _context.Addresses.Add(address);

                //Nếu như address mới người dùng để là mặc định thì chuyển isdefault thành false
                if (defaultAddress != null)
                {
                    defaultAddress.IsDefault = false;
                    _context.Addresses.Update(defaultAddress);
                    _context.SaveChanges();
                }

                _context.SaveChanges();

            }
            catch (Exception ex)
            {
                return "Create Address failed!";
            }
            return "Create Address successfully!";
        }

        public async Task<string> DeleteAddressAsync(Address address)
        {
            try
            {
                _context.Remove(address);
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                return "Delete Address failed!";
            }
            return "Delete Address successfully!";
        }

        public async Task<Address> GetAddressByIdAsync(string addressId)
        {
            return await _context.Addresses.Where(a => a.Id.Equals(addressId)).FirstOrDefaultAsync();
        }

        public async Task<Address> GetDefaultAddressAsync()
        {
            return await _context.Addresses.Where(a => a.IsDefault == true).FirstOrDefaultAsync();
        }
        public async Task<IEnumerable<Address>> GetAllAddressByUserIdAsync(string userId)
        {
            return await _context.Addresses.Where(a => a.UserID == userId).ToListAsync();
        }

        public async Task<string> UpdateAddressAsync(Address address, RequestCreateAndUpdateAddress request, Address defaultAddress)
        {
            try
            {
                //Nếu như address mới người dùng để là mặc định thì chuyển isdefault thành false
                if (defaultAddress != null)
                {
                    defaultAddress.IsDefault = false;
                    _context.Addresses.Update(defaultAddress);
                    var status = await _context.SaveChangesAsync();

                }
            }
            catch (Exception ex)
            {
                return "Update Address default information error!";
            }
            try
            {
                address.Line1 = request.Line1;
                address.Line2 = request.Line2;
                address.IsDefault = request.IsDefault;
                address.City = request.City;
                address.Country = request.Country;
                address.PosttalCode = request.PosttalCode;
                address.ContactName = request.ContactName;
                address.ContactPhone = request.ContactPhone;
                address.GhnProvinceId = request.GhnProvinceId;
                address.GhnDistrictId = request.GhnDistrictId;
                address.GhnWardCode = request.GhnWardCode;


            }
            catch (Exception ex)
            {
                return "Update Address information error!";
            }

            try
            {
                _context.Addresses.Update(address);
                var status = await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return "Update Address failed!";
            }
            return "Update Address successfully!";
        }
    }
}
