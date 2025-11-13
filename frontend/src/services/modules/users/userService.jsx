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
};

