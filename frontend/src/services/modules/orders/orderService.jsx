import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const OrderService = {
  async createOrder(payload) {
    const response = await axiosClient.post(API_ENDPOINTS.ORDERS.ROOT, payload);
    return response.data;
  },

  async getOrders(params = {}) {
    const response = await axiosClient.get(API_ENDPOINTS.ORDERS.ROOT, { params });
    return response.data;
  },

  async getById(orderId) {
    if (!orderId) {
      throw new Error('Missing order id');
    }
    const response = await axiosClient.get(API_ENDPOINTS.ORDERS.BY_ID(orderId));
    return response.data;
  },

  async cancelOrder(orderId, payload = {}) {
    if (!orderId) {
      throw new Error('Missing order id');
    }
    const response = await axiosClient.post(
      API_ENDPOINTS.ORDERS.CANCEL(orderId),
      payload,
    );
    return response.data;
  },
};
