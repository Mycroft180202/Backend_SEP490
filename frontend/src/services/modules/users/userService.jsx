import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const UserService = {
  getUsers: async (params = {}) => {
    try {
      const {
        pageIndex = 1,
        pageSize = 10,
        isActive,
      } = params;

      const query = {
        pageIndex,
        pageSize,
      };

      if (typeof isActive === 'boolean') {
        query.isactive = isActive;
      }

      const response = await axiosClient.get(API_ENDPOINTS.USERS.ADMIN_LIST, {
        params: query,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.USERS.ADMIN_DETAIL(id));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (id, payload) => {
    try {
      const response = await axiosClient.put(API_ENDPOINTS.USERS.ADMIN_DETAIL(id), payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
