import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';

const CART_CACHE_MAX_AGE_MS = 15000;
const cartCache = {
  ts: 0,
  quantitiesByProductId: new Map(),
};

const emitCartUpdated = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('cart:updated'));
};

const normalizeId = (value) => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length ? str : null;
};

const updateCartCache = (items) => {
  if (!Array.isArray(items)) return;
  const next = new Map();
  items.forEach((item) => {
    const pid = normalizeId(item?.productId || item?.product?.id || item?.product?.productId);
    if (!pid) return;
    const qty = Number(item?.quantity ?? 0);
    if (!Number.isFinite(qty)) return;
    next.set(pid, (next.get(pid) || 0) + qty);
  });
  cartCache.quantitiesByProductId = next;
  cartCache.ts = Date.now();
};

const getCachedQuantity = (productId) => {
  const pid = normalizeId(productId);
  if (!pid) return null;
  if (!cartCache.ts || Date.now() - cartCache.ts > CART_CACHE_MAX_AGE_MS) return null;
  return cartCache.quantitiesByProductId.get(pid) ?? 0;
};

const clampPositiveInt = (value, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const floored = Math.floor(parsed);
  return floored > 0 ? floored : fallback;
};

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
    const productWrapper = item?.product || {};
    const product = (
      productWrapper
      && typeof productWrapper === 'object'
      && productWrapper.product
      && typeof productWrapper.product === 'object'
        ? productWrapper.product
        : productWrapper
    );
    
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

    const artisanId =
      product?.artisanId
      ?? product?.artisanID
      ?? product?.artisan_id
      ?? product?.ownerId
      ?? product?.ownerID
      ?? product?.artisan?.userId
      ?? product?.artisan?.userID
      ?? null;

    return {
      id: normalizedId,
      cartItemId: normalizedId,
      productId: item?.productId || product?.id || product?.productId,
      artisanId,
      name: product?.name || item?.productName || item?.name || 'Product',
      image: imageUrl,
      imageUrl: imageUrl, // Thêm cả imageUrl để đồng bộ
      price: priceAtAdd,
      priceAtAdd,
      quantity: item?.quantity ?? 1,
      isActive: item?.isActive ?? product?.isActive ?? true,
      stock: item?.stock ?? product?.stock,
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
    updateCartCache(items);

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

  getCachedQuantity(productId) {
    return getCachedQuantity(productId);
  },

  addItem: async (productId, priceAtAdd = 0, quantity = 1) => {
    const payload = {
      productId,
      priceAtAdd,
      quantity,
    };
    const response = await axiosClient.post(API_ENDPOINTS.CART.ROOT, payload);
    emitCartUpdated();
    return response.data;
  },

  addItemValidated: async (productId, priceAtAdd = 0, quantity = 1, stock) => {
    const requested = clampPositiveInt(quantity, 1);
    const cachedQty = getCachedQuantity(productId);
    const currentQty = cachedQty ?? (() => null)();

    let existingQty = currentQty;
    if (existingQty === null) {
      try {
        await CartService.getCart(1, 200);
        const pid = normalizeId(productId);
        existingQty = pid ? cartCache.quantitiesByProductId.get(pid) ?? 0 : 0;
      } catch (error) {
        existingQty = 0;
      }
    }

    const stockLimit = Number(stock);
    const hasStockLimit = Number.isFinite(stockLimit) && stockLimit >= 0;
    const remaining = hasStockLimit ? Math.max(0, Math.floor(stockLimit) - (existingQty || 0)) : null;

    if (hasStockLimit && remaining <= 0) {
      return {
        success: false,
        requested,
        added: 0,
        message: 'Số lượng sản phẩm trong giỏ đã đạt tối đa theo tồn kho.',
      };
    }

    const toAdd = hasStockLimit ? Math.min(requested, remaining) : requested;
    await CartService.addItem(productId, priceAtAdd, toAdd);

    // Optimistically update cache; realtime/backend can correct if needed.
    const pid = normalizeId(productId);
    if (pid) {
      const nextQty = (existingQty || 0) + toAdd;
      cartCache.quantitiesByProductId.set(pid, nextQty);
      cartCache.ts = Date.now();
    }

    return {
      success: true,
      requested,
      added: toAdd,
      limited: hasStockLimit && toAdd < requested,
      remainingAfter: hasStockLimit ? Math.max(0, Math.floor(stockLimit) - ((existingQty || 0) + toAdd)) : null,
    };
  },

  updateItem: async (cartItemId, quantity) => {
    const response = await axiosClient.put(
      API_ENDPOINTS.CART.ROOT,
      null,
      { params: { cartItemId, quantity } },
    );
    emitCartUpdated();
    return response.data;
  },

  removeItem: async (cartItemId) => {
    const response = await axiosClient.delete(API_ENDPOINTS.CART.ROOT, {
      params: { cartItemId },
    });
    emitCartUpdated();
    return response.data;
  },
};
