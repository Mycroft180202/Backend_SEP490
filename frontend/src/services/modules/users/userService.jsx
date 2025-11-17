import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

const userCache = new Map();

export const UserService = {
  async getById(id) {
    if (!id) {
      throw new Error('Missing user id');
    }

    if (userCache.has(id)) {
      return userCache.get(id);
    }

    const response = await axiosClient.get(API_ENDPOINTS.USERS.BY_ID(id));
    const data = response.data;
    userCache.set(id, data);
    return data;
  },

  async getAddresses() {
    const response = await axiosClient.get(API_ENDPOINTS.USERS.ADDRESSES);
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data
        ?? [];
  },

  async addAddress(addressData) {
    if (!addressData) {
      throw new Error('Missing address payload');
    }

    const payload = { ...addressData };

    if (payload.ghnProvinceId !== undefined && payload.ghnProvinceId !== null) {
      const provinceId = Number(payload.ghnProvinceId);
      payload.ghnProvinceId = Number.isNaN(provinceId) ? undefined : provinceId;
    }

    if (payload.ghnDistrictId !== undefined && payload.ghnDistrictId !== null) {
      const districtId = Number(payload.ghnDistrictId);
      payload.ghnDistrictId = Number.isNaN(districtId) ? undefined : districtId;
    }

    if (typeof payload.ghnWardCode === 'string') {
      payload.ghnWardCode = payload.ghnWardCode.trim();
    }

    const response = await axiosClient.post(API_ENDPOINTS.USERS.ADDRESSES, payload);
    userCache.clear();
    return response.data;
  },

  async updateAddress(id, addressData) {
    if (!id) {
      throw new Error('Missing address id');
    }
    if (!addressData) {
      throw new Error('Missing address payload');
    }

    const payload = { ...addressData };

    if (payload.ghnProvinceId !== undefined && payload.ghnProvinceId !== null) {
      const provinceId = Number(payload.ghnProvinceId);
      payload.ghnProvinceId = Number.isNaN(provinceId) ? undefined : provinceId;
    }

    if (payload.ghnDistrictId !== undefined && payload.ghnDistrictId !== null) {
      const districtId = Number(payload.ghnDistrictId);
      payload.ghnDistrictId = Number.isNaN(districtId) ? undefined : districtId;
    }

    if (typeof payload.ghnWardCode === 'string') {
      payload.ghnWardCode = payload.ghnWardCode.trim();
    }

    const response = await axiosClient.put(
      API_ENDPOINTS.USERS.ADDRESSES,
      payload,
      { params: { addressId: id } },
    );
    userCache.clear();
    return response.data;
  },

  async getAddressById(id) {
    if (!id) {
      throw new Error('Missing address id');
    }
    const response = await axiosClient.get(API_ENDPOINTS.USERS.ADDRESS_BY_ID(id));
    return response.data;
  },

  async deleteAddress(id) {
    if (!id) {
      throw new Error('Missing address id');
    }
    const response = await axiosClient.delete(
      API_ENDPOINTS.USERS.ADDRESSES,
      { params: { addressId: id } },
    );
    userCache.clear();
    return response.data;
  },

  clearCache() {
    userCache.clear();
  },

  async adminList(pageIndex = 1, pageSize = 10) {
    const response = await axiosClient.get('/users', {
      params: { pageIndex, pageSize },
    });
    return response.data;
  },

  async adminUpdate(id, payload) {
    if (!id) {
      throw new Error('Missing user id');
    }
    const body = {
      isActive: payload?.isActive,
      rolesId: payload?.rolesId || null,
    };
    const response = await axiosClient.put(`/users/${id}`, body);
    userCache.delete(id);
    return response.data;
  },
};
