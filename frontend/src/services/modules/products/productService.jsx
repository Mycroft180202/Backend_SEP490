import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const ProductService = {
  getAllProducts: async (params = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.GET_ALL, { params });
    return response.data;
  },

  getProductById: async (id) => {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.GET_BY_ID(id));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await axiosClient.post(API_ENDPOINTS.PRODUCTS.CREATE, productData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    const response = await axiosClient.put(API_ENDPOINTS.PRODUCTS.UPDATE(id), productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));
    return response.data;
  },

  updateStatus: async (id, isActive) => {
    const response = await axiosClient.put(API_ENDPOINTS.PRODUCTS.UPDATE(id), { isActive });
    return response.data;
  },

  getProductsByCategory: async (categoryId, params = {}) => {
    try {
      const response = await axiosClient.get(`${API_ENDPOINTS.PRODUCTS.GET_ALL}?categoryId=${categoryId}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

};
