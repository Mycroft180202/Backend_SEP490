import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const VoucherService = {
  async list(pageIndex = 1, pageSize = 10) {
    const response = await axiosClient.get(API_ENDPOINTS.VOUCHERS.ROOT, {
      params: { pageIndex, pageSize },
    });
    return response.data;
  },

  async getById(id) {
    if (!id) throw new Error('Missing voucher id');
    const response = await axiosClient.get(API_ENDPOINTS.VOUCHERS.BY_ID(id));
    return response.data;
  },

  async create(payload) {
    const response = await axiosClient.post(API_ENDPOINTS.VOUCHERS.ROOT, payload);
    return response.data;
  },

  async update(id, payload) {
    if (!id) throw new Error('Missing voucher id');
    const response = await axiosClient.put(API_ENDPOINTS.VOUCHERS.BY_ID(id), payload);
    return response.data;
  },

  async remove(id) {
    if (!id) throw new Error('Missing voucher id');
    const response = await axiosClient.delete(API_ENDPOINTS.VOUCHERS.BY_ID(id));
    return response.data;
  },
};
