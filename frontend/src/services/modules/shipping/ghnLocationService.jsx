import axiosClient from '../../api/axiosConfig';

const provinceCache = [];
const districtCache = new Map(); // provinceId -> districts[]
const wardCache = new Map(); // districtId -> wards[]

export const GHNLocationService = {
  async getProvinces() {
    if (provinceCache.length > 0) {
      return provinceCache;
    }
    const response = await axiosClient.get('/api/ghn/master-data/provinces');
    const provinces = Array.isArray(response?.data) ? response.data : [];
    provinceCache.splice(0, provinceCache.length, ...(provinces || []));
    return provinces;
  },

  async getDistricts(provinceId) {
    if (!provinceId) {
      return [];
    }
    const cacheKey = Number(provinceId);
    if (districtCache.has(cacheKey)) {
      return districtCache.get(cacheKey);
    }
    const response = await axiosClient.get(
      '/api/ghn/master-data/districts',
      { params: { provinceId: cacheKey } },
    );
    const districts = Array.isArray(response?.data) ? response.data : [];
    districtCache.set(cacheKey, districts || []);
    return districts;
  },

  async getWards(districtId) {
    if (!districtId) {
      return [];
    }
    const cacheKey = Number(districtId);
    if (wardCache.has(cacheKey)) {
      return wardCache.get(cacheKey);
    }
    const response = await axiosClient.get(
      '/api/ghn/master-data/wards',
      { params: { districtId: cacheKey } },
    );
    const wards = Array.isArray(response?.data) ? response.data : [];
    wardCache.set(cacheKey, wards || []);
    return wards;
  },

  async getShippingFee(payload) {
    if (!payload || !payload.toDistrictId || !payload.toWardCode) {
      return 0;
    }
    const defaultPayload = {
      service_type_id: 2,
      weight: 500,
      height: 10,
      length: 20,
      width: 10,
      insurance_value: 0,
    };
    const finalPayload = { ...defaultPayload, ...payload };
    const response = await axiosClient.post('/api/ghn/shipping/fee', finalPayload);
    const data = response?.data;
    const fee = Number(
      data?.total
      ?? data?.totalFee
      ?? data?.service_fee
      ?? data?.fee
      ?? data,
    );
    return Number.isFinite(fee) ? fee : 0;
  },
};
