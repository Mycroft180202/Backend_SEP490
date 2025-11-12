import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const buildFormData = ({
  title,
  content,
  image,
  postStatus,
}) => {
  const formData = new FormData();
  formData.append('Title', title || '');
  formData.append('Content', content || '');

  if (postStatus) {
    formData.append('PostStatus', postStatus);
  }

  if (image instanceof File || image instanceof Blob) {
    formData.append('Image', image);
  }

  return formData;
};

export const BlogService = {
  getAll: async (params = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.BLOGS.ROOT, { params });
    const data = response?.data || {};
    const items = normalizeList(data);

    return {
      raw: data,
      items,
      pageIndex: data.pageIndex ?? params.pageIndex ?? 1,
      pageSize: data.pageSize ?? params.pageSize ?? items.length,
      totalPages: data.totalPages ?? 1,
      totalCount: data.totalCount ?? items.length,
      hasNextPage: data.hasNextPage ?? false,
      hasPreviousPage: data.hasPreviousPage ?? false,
    };
  },

  getById: async (id) => {
    const response = await axiosClient.get(API_ENDPOINTS.BLOGS.BY_ID(id));
    return response.data;
  },

  create: async (payload = {}) => {
    const body = payload instanceof FormData ? payload : buildFormData(payload);
    const response = await axiosClient.post(
      API_ENDPOINTS.BLOGS.ROOT,
      body,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  update: async (id, payload = {}) => {
    const body = payload instanceof FormData ? payload : buildFormData(payload);
    const response = await axiosClient.put(
      API_ENDPOINTS.BLOGS.ROOT,
      body,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: { Id: id },
      },
    );
    return response.data;
  },
};
