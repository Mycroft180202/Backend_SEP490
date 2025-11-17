import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const ShopService = {
  async getMyShop() {
    const response = await axiosClient.get(API_ENDPOINTS.SHOP.MY_SHOP);
    return response.data;
  },

  async updateMyShop({ shopName, phoneNumber, shopUrlImage }) {
    const formData = new FormData();
    if (shopName) formData.append('ShopName', shopName);
    if (phoneNumber) formData.append('PhoneNumber', phoneNumber);
    if (shopUrlImage) formData.append('ShopURLImage', shopUrlImage);
    const response = await axiosClient.put(API_ENDPOINTS.SHOP.UPDATE_MY_SHOP, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
