import axiosClient from '../../api/axiosConfig';

const StorytellingService = {
  async getStoriesByProduct(productId) {
    const response = await axiosClient.get('/product/story-telling', {
      params: { productId },
    });
    return response.data;
  },

  async getStoryById(storyId) {
    const response = await axiosClient.get(`/product/story-telling/${storyId}`);
    return response.data;
  },

  async createStory(productId, data) {
    const formData = new FormData();
    formData.append('StoryType', data.storyType);
    formData.append('Title', data.title);
    formData.append('Content', data.content || '');
    if (productId) {
      formData.append('ProductId', productId);
    }
    if (data.image instanceof File) {
      formData.append('Image', data.image);
    }

    const response = await axiosClient.post('/product/story-telling', formData, {
      params: { productId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateStory(storyId, data) {
    const formData = new FormData();
    formData.append('StoryType', data.storyType);
    formData.append('Title', data.title);
    formData.append('Content', data.content || '');
    if (data.image instanceof File) {
      formData.append('Image', data.image);
    }

    const response = await axiosClient.put('/product/story-telling', formData, {
      params: { storyTellingId: storyId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteStory(storyId) {
    const response = await axiosClient.delete('/product/story-telling', {
      params: { storyTellingId: storyId },
    });
    return response.data;
  },
};

export default StorytellingService;
