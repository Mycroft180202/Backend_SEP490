import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

const normalizeCartItems = (data) => {
  const sourceItems =
    data?.cartItems?.items
    || data?.cartItems
    || data?.items
    || data?.data
    || [];

  if (!Array.isArray(sourceItems)) {
    return [];
  }

  return sourceItems.map((item, index) => {
    const product = item?.product || {};
    
    // Ưu tiên lấy imageUrl từ product trước, sau đó mới là images array
    let imageUrl = product?.imageUrl || item?.imageUrl;
    if (!imageUrl) {
      const productImages = product?.images || [];
      const firstImage = Array.isArray(productImages)
        ? productImages[0]?.url || productImages[0]
        : productImages?.url;
      imageUrl = firstImage || '/images/default-product.png';
    }

    const priceAtAdd = item?.priceAtAdd ?? product?.price ?? item?.price ?? 0;

    const normalizedId =
      item?.id
      || item?.cartItemId
      || product?.id
      || product?.productId
      || item?.productId
      || `cart-item-${index}`;

    return {
      id: normalizedId,
      cartItemId: normalizedId,
      productId: item?.productId || product?.id || product?.productId,
      name: product?.name || item?.productName || item?.name || 'Product',
      image: imageUrl,
      imageUrl: imageUrl, // Thêm cả imageUrl để đồng bộ
      price: priceAtAdd,
      priceAtAdd,
      quantity: item?.quantity ?? 1,
      product,
    };
  });
};

export const CartService = {
  getCart: async (pageIndex = 1, pageSize = 10) => {
    const response = await axiosClient.get(API_ENDPOINTS.CART.ROOT, {
      params: { pageIndex, pageSize },
    });
    const data = response?.data || {};
    const items = normalizeCartItems(data);

    const subtotal = items.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 0),
      0,
    );

    const shipping = data?.shippingFee ?? (items.length > 0 ? 30000 : 0);

    return {
      raw: data,
      items,
      subtotal,
      shipping,
      totalAmount: typeof data.totalAmount === 'number'
        ? data.totalAmount
        : subtotal + shipping,
    };
  },

  addItem: async (productId, priceAtAdd = 0, quantity = 1) => {
    const payload = {
      productId,
      priceAtAdd,
      quantity,
    };
    const response = await axiosClient.post(API_ENDPOINTS.CART.ROOT, payload);
    return response.data;
  },

  updateItem: async (cartItemId, quantity) => {
    const response = await axiosClient.put(
      API_ENDPOINTS.CART.ROOT,
      null,
      { params: { cartItemId, quantity } },
    );
    return response.data;
  },

  removeItem: async (cartItemId) => {
    const response = await axiosClient.delete(API_ENDPOINTS.CART.ROOT, {
      params: { cartItemId },
    });
    return response.data;
  },
};
