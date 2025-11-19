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
