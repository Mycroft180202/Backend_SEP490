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
    const formData = productData instanceof FormData ? productData : buildFormData(productData);
    const response = await axiosClient.post(
      API_ENDPOINTS.PRODUCTS.CREATE,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const formData = productData instanceof FormData ? productData : buildFormData(productData);
    const response = await axiosClient.put(
      API_ENDPOINTS.PRODUCTS.UPDATE(id),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
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

  submitFeedback: async (productId, userId, feedbackData) => {
    try {
      console.log('Submitting feedback:', { productId, userId, feedbackData });
      const url = `/feedbacks?productid=${productId}&userid=${userId}`;
      console.log('API URL:', url);
      const response = await axiosClient.post(url, feedbackData);
      console.log('Feedback response:', response);
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        data: error.response?.data
      });
      throw error;
    }
  },

  getFeedbacks: async (productId, pageIndex = 1, pageSize = 5) => {
    try {
      const response = await axiosClient.get(
        `/feedbacks/${productId}?pageIndex=${pageIndex}&pageSize=${pageSize}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      throw error;
    }
  },

  updateFeedback: async (productId, userId, feedbackId, feedbackData) => {
    try {
      console.log('Updating feedback:', { productId, userId, feedbackId, feedbackData });
      const url = `/feedbacks?productid=${productId}&userid=${userId}&feedbackid=${feedbackId}`;
      const response = await axiosClient.put(url, feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  },

  deleteFeedback: async (feedbackId, userId) => {
    try {
      console.log('Deleting feedback:', { feedbackId, userId });
      const url = `/feedbacks?feedbackid=${feedbackId}&IdduserId=${userId}`;
      const response = await axiosClient.delete(url);
      return response.data;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  },

};

// helper to map plain object to FormData
function buildFormData(data = {}) {
  const fd = new FormData();
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'images' && Array.isArray(value)) {
      value.forEach((file) => {
        if (file) fd.append('images', file);
      });
    } else {
      fd.append(key, value);
    }
  });
  return fd;
}
