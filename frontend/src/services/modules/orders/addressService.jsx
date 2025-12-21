import { UserService } from '../users/userService';
import { GHNLocationService } from '../shipping/ghnLocationService';

const addressDetailCache = new Map();

export const AddressService = {
  /**
   * Get address detail with full location information
   * @param {string} addressId - The address ID (shipingAddressId from order)
   * @returns {Promise<Object>} Address with province, district, ward names
   */
  async getAddressDetail(addressId) {
    if (!addressId) {
      throw new Error('Missing address ID');
    }

    // Check cache first
    if (addressDetailCache.has(addressId)) {
      return addressDetailCache.get(addressId);
    }

    try {
      // Step 1: Get address basic info
      const address = await UserService.getAddressById(addressId);

      if (!address) {
        throw new Error('Address not found');
      }

      // Step 2: Get all provinces to find province name
      let provinceName = address.city || 'Unknown';
      if (address.ghnProvinceId) {
        const provinces = await GHNLocationService.getProvinces();
        const province = provinces.find(
          (p) => p.ProvinceID === address.ghnProvinceId
        );
        if (province) {
          provinceName = province.ProvinceName;
        }
      }

      // Step 3: Get districts for the province and find district name
      let districtName = 'Unknown';
      if (address.ghnDistrictId && address.ghnProvinceId) {
        const districts = await GHNLocationService.getDistricts(
          address.ghnProvinceId
        );
        const district = districts.find(
          (d) => d.DistrictID === address.ghnDistrictId
        );
        if (district) {
          districtName = district.DistrictName;
        }
      }

      // Step 4: Get wards for the district and find ward name
      let wardName = 'Unknown';
      if (address.ghnWardCode && address.ghnDistrictId) {
        const wards = await GHNLocationService.getWards(address.ghnDistrictId);
        const ward = wards.find((w) => w.WardCode === address.ghnWardCode);
        if (ward) {
          wardName = ward.WardName;
        }
      }

      // Step 5: Combine all information
      const fullAddress = {
        ...address,
        provinceName,
        districtName,
        wardName,
      };

      // Cache the result
      addressDetailCache.set(addressId, fullAddress);

      return fullAddress;
    } catch (error) {
      console.error('Error fetching address detail:', error);
      throw error;
    }
  },

  /**
   * Format address for display
   * @param {Object} addressData - Address data with province/district/ward names
   * @returns {string} Formatted address string
   */
  formatAddressDisplay(addressData) {
    if (!addressData) {
      return 'Không có thông tin địa chỉ';
    }

    const parts = [];

    if (addressData.line1) {
      parts.push(addressData.line1);
    }

    if (addressData.wardName) {
      parts.push(addressData.wardName);
    }

    if (addressData.districtName) {
      parts.push(addressData.districtName);
    }

    if (addressData.provinceName) {
      parts.push(addressData.provinceName);
    }

    if (addressData.country) {
      parts.push(addressData.country);
    }

    return parts.join(', ');
  },

  /**
   * Clear address cache
   */
  clearCache() {
    addressDetailCache.clear();
  },

  /**
   * Clear specific address from cache
   */
  clearAddressCache(addressId) {
    if (addressId) {
      addressDetailCache.delete(addressId);
    }
  },
};
