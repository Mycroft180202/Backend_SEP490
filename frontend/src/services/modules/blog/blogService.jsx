import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

export const BlogService = {
  getAll: async (params = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.BLOGS.ROOT, { params });
    const items = normalizeList(response.data);
    return {
      raw: response.data,
      items,
    };
  },

  getById: async (id) => {
    const response = await axiosClient.get(API_ENDPOINTS.BLOGS.BY_ID(id));
    return response.data;
  },

  create: async (payload) => {
    const response = await axiosClient.post(API_ENDPOINTS.BLOGS.ROOT, payload, {
      headers: {
        'Content-Type': payload instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    });
    return response.data;
  },

  update: async (id, payload) => {
    const response = await axiosClient.put(
      API_ENDPOINTS.BLOGS.ROOT,
      payload,
      {
        params: { id },
        headers: {
          'Content-Type': payload instanceof FormData ? 'multipart/form-data' : 'application/json',
        },
      },
    );
    return response.data;
  },
};
