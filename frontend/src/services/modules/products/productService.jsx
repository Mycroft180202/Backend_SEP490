import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const ProductService = {
  getAllProducts: async () => {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.PRODUCTS.GET_ALL);
      return response.data;
    } catch (error) {
      throw error;
    }
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
    try {
      const response = await axiosClient.put(API_ENDPOINTS.PRODUCTS.UPDATE(id), productData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await axiosClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};