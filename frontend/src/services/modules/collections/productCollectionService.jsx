import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const ProductCollectionService = {
  async list(params = {}) {
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCT_COLLECTION.ROOT, { params });
    return response.data;
  },

  async getById(id) {
    if (!id) throw new Error('Missing collection id');
    const response = await axiosClient.get(API_ENDPOINTS.PRODUCT_COLLECTION.BY_ID(id));
    return response.data;
  },

  async create(form) {
    const formData = new FormData();
    if (form.title) formData.append('Title', form.title);
    if (form.headline) formData.append('Headline', form.headline);
    if (form.content) formData.append('Content', form.content);
    if (form.imageFile) formData.append('ImageFile', form.imageFile);
    if (Array.isArray(form.productIds)) {
      form.productIds.forEach((p) => formData.append('ProductIds', p));
    }
    if (form.createdById) formData.append('CreatedById', form.createdById);
    const response = await axiosClient.post(API_ENDPOINTS.PRODUCT_COLLECTION.ROOT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateInfo(form) {
    const formData = new FormData();
    if (form.productCollectionId) formData.append('ProductCollectionId', form.productCollectionId);
    if (form.title) formData.append('Title', form.title);
    if (form.headline) formData.append('Headline', form.headline);
    if (form.content) formData.append('Content', form.content);
    if (form.imageFile) formData.append('Image', form.imageFile);
    if (typeof form.isActive === 'boolean') formData.append('IsActive', form.isActive);
    if (Array.isArray(form.productIds)) {
      form.productIds.forEach((p) => formData.append('ProductIds', p));
    }
    const response = await axiosClient.put(API_ENDPOINTS.PRODUCT_COLLECTION.ROOT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async remove(id) {
    if (!id) throw new Error('Missing collection id');
    const response = await axiosClient.delete(API_ENDPOINTS.PRODUCT_COLLECTION.ROOT, {
      params: { id },
    });
    return response.data;
  },
};
