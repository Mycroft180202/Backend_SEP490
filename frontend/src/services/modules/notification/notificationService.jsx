import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const NotificationService = {
  async getList(params = {}) {
    const response = await axiosClient.get(API_ENDPOINTS.NOTIFICATIONS.ROOT, { params });
    return response.data;
  },

  async markRead(id) {
    if (!id) throw new Error('Missing notification id');
    const response = await axiosClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    return response.data;
  },

  async markAllRead() {
    const response = await axiosClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    return response.data;
  },

  async remove(id) {
    if (!id) throw new Error('Missing notification id');
    const response = await axiosClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
    return response.data;
  },

  async adminSend(payload) {
    const response = await axiosClient.post(API_ENDPOINTS.NOTIFICATIONS.ADMIN_SEND, payload);
    return response.data;
  },
};
