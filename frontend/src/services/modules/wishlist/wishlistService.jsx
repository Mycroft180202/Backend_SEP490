import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

export const WishlistService = {
  async getList(pageIndex = 1, pageSize = 20) {
    const response = await axiosClient.get(API_ENDPOINTS.WISHLIST.ROOT, {
      params: { pageIndex, pageSize },
    });
    return response.data;
  },

  async add(productId) {
    if (!productId) throw new Error('Missing productId');
    const response = await axiosClient.post(API_ENDPOINTS.WISHLIST.ROOT, null, {
      params: { productId },
    });
    return response.data;
  },

  async remove(wishListItemId) {
    if (!wishListItemId) throw new Error('Missing wishListItemId');
    const response = await axiosClient.delete(API_ENDPOINTS.WISHLIST.ROOT, {
      params: { wishListItemId },
    });
    return response.data;
  },
};
