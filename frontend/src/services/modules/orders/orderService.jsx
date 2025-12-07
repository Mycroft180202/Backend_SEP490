import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const OrderService = {
  async createOrder(payload) {
    const response = await axiosClient.post(API_ENDPOINTS.ORDERS.ROOT, payload);
    return response.data;
  },

  async getOrders(filter = {}) {
    const response = await axiosClient.post(API_ENDPOINTS.ORDERS.MY_ORDERS, filter);
    return response.data;
  },

  async getAdminOrders({ pageIndex = 1, pageSize = 10, paymentType, status, keyword } = {}) {
    const params = {
      pageIndex,
      pageSize,
    };
    if (paymentType) {
      params.paymentType = paymentType;
    }
    if (status) {
      params.status = status;
    }
    if (keyword) {
      params.keyword = keyword;
    }
    const response = await axiosClient.get('/api/Order/orders', { params });
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

  async getMyOrders(pageIndex = 1, pageSize = 10) {
    try {
      const response = await axiosClient.get('/api/Order/my-orders', {
        params: {
          pageIndex,
          pageSize
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },

  async getOrderDetail(orderNumber) {
    try {
      if (!orderNumber) {
        throw new Error('Missing order number');
      }
      const response = await axiosClient.get(`/api/Order/orders/${orderNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order detail:', error);
      throw error;
    }
  },

  async cancelOrderByNumber(orderNumber, reason) {
    try {
      if (!orderNumber) {
        throw new Error('Missing order number');
      }
      if (!reason) {
        throw new Error('Missing cancellation reason');
      }
      const payload = { reason };
      const response = await axiosClient.post(
        `/api/Order/orders/${orderNumber}/cancel`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },

  async continuePayment(orderNumber) {
    try {
      if (!orderNumber) {
        throw new Error('Missing order number');
      }
      const response = await axiosClient.post(
        API_ENDPOINTS.ORDERS.CONTINUE_PAYMENT(orderNumber)
      );
      return response.data;
    } catch (error) {
      console.error('Error continuing payment:', error);
      throw error;
    }
  },

  async confirmOrderReceived(orderNumber) {
    try {
      if (!orderNumber) {
        throw new Error('Missing order number');
      }
      const response = await axiosClient.post(
        `/api/Order/orders/${orderNumber}/confirm-received`
      );
      return response.data;
    } catch (error) {
      console.error('Error confirming order received:', error);
      throw error;
    }
  },
};
