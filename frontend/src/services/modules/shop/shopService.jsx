import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const ShopService = {
  async getMyShop() {
    const response = await axiosClient.get(API_ENDPOINTS.SHOP.MY_SHOP);
    return response.data;
  },

  async updateMyShop({ shopName, phoneNumber, bio, shopUrlImage }) {
    const formData = new FormData();
    if (shopName !== undefined && shopName !== null) formData.append('ShopName', shopName);
    if (phoneNumber !== undefined && phoneNumber !== null) formData.append('PhoneNumber', phoneNumber);
    if (bio !== undefined && bio !== null) formData.append('Bio', bio);
    if (shopUrlImage) formData.append('ShopURLImage', shopUrlImage);
    const response = await axiosClient.put(API_ENDPOINTS.SHOP.UPDATE_MY_SHOP, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getShopByUserId(userId) {
    if (!userId) throw new Error('Missing user id');
    const response = await axiosClient.get(API_ENDPOINTS.SHOP.BY_USER, {
      params: { userId },
    });
    return response.data;
  },
};
