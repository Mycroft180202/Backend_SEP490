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
};