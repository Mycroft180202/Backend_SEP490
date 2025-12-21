import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const CategoryService = {

  getAllCategories: async () => {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.Categories.GET_ALL);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createCategory: async (payload) => {
    try {
      const response = await axiosClient.post(API_ENDPOINTS.Categories.CREATE, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateCategory: async (id, payload) => {
    try {
      const response = await axiosClient.put(API_ENDPOINTS.Categories.UPDATE(id), payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};