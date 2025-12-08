import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency";
import OrderDetailModal from "./OrderDetailModal";
import CancelOrderDialog from "./CancelOrderDialog";
import ReturnOrderDialog from "./ReturnOrderDialog";
import { OrderService } from "../../services/modules/orders/orderService";
import { toast } from "react-toastify";
import { ProductService } from "../../services/modules/products/productService";
import { ShopService } from "../../services/modules/shop/shopService";
import { resolveProductArtisanId } from "../../utils/productOwnership";

const productCache = new Map();
const shopCache = new Map();

const pickFirstNonEmpty = (values = []) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) return trimmed;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
};

const normalizeShopData = (raw, fallback = {}) => {
  if (!raw || typeof raw !== 'object') {
    return {
      shopName: fallback.shopName || 'Cửa hàng',
      shopAvatar: fallback.shopAvatar || null,
      artisanId: fallback.artisanId || null,
    };
  }

  const shopName = pickFirstNonEmpty([
    raw.shopName,
    raw.name,
    raw.displayName,
    raw.title,
    fallback.shopName,
  ]);

  const shopAvatar = pickFirstNonEmpty([
    raw.shopUrlImage,
    raw.shopURLImage,
    raw.shopImage,
    raw.shopAvatar,
    raw.logoUrl,
    raw.logoURL,
    raw.avatarUrl,
    raw.avatarURL,
    raw.imageUrl,
    raw.imageURL,
    fallback.shopAvatar,
  ]);

  const artisanId = pickFirstNonEmpty([
    raw.userId,
    raw.userID,
    raw.ownerId,
    raw.ownerID,
    raw.id,
    fallback.artisanId,
  ]);

  return {
    shopName: shopName || fallback.shopName || 'Cửa hàng',
    shopAvatar: shopAvatar || fallback.shopAvatar || null,
    artisanId: artisanId != null ? String(artisanId) : (fallback.artisanId || null),
  };
};

const deriveShopFallback = ({ order, item, product }) => {
  const orderShop = (order && (order.shop || order.store || order.artisan)) || {};
  const itemShop = (item && (item.shop || item.store || item.artisan)) || {};
  const productShop = (product && (product.shop || product.store || product.artisan)) || {};

  const shopName = pickFirstNonEmpty([
    order?.shopName,
    order?.storeName,
    orderShop.shopName,
    orderShop.name,
    item?.shopName,
    item?.sellerName,
    itemShop.shopName,
    itemShop.name,
    product?.shopName,
    product?.shop_code,
    product?.ownerName,
    product?.artisanName,
    productShop.shopName,
    productShop.name,
    productShop.displayName,
  ]);

  const shopAvatar = pickFirstNonEmpty([
    order?.shopAvatar,
    order?.shopImage,
    orderShop.shopUrlImage,
    orderShop.shopURLImage,
    orderShop.logoUrl,
    orderShop.logoURL,
    orderShop.avatarUrl,
    orderShop.avatarURL,
    item?.shopAvatar,
    itemShop.shopUrlImage,
    itemShop.shopURLImage,
    itemShop.logoUrl,
    itemShop.logoURL,
    itemShop.avatarUrl,
    itemShop.avatarURL,
    product?.shopImage,
    product?.shopAvatar,
    product?.ownerAvatar,
    productShop.shopUrlImage,
    productShop.shopURLImage,
    productShop.logoUrl,
    productShop.logoURL,
    productShop.avatarUrl,
    productShop.avatarURL,
  ]);

  const artisanId = pickFirstNonEmpty([
    order?.artisanId,
    orderShop.userId,
    orderShop.userID,
    orderShop.id,
    item?.artisanId,
    item?.ownerId,
    item?.ownerID,
    itemShop.userId,
    itemShop.userID,
    product?.artisanId,
    product?.artisanID,
    product?.ownerId,
    product?.ownerID,
    productShop.userId,
    productShop.userID,
    resolveProductArtisanId(product),
  ]);

  return {
    shopName: shopName || null,
    shopAvatar: shopAvatar || null,
    artisanId: artisanId != null ? String(artisanId) : null,
  };
};

const buildArtisanHref = (artisanId) => {
  if (!artisanId) return null;
  return `/artisan-shop?artisanId=${encodeURIComponent(artisanId)}`;
};

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    WaitingForPickup: { bg: '#FFF3CD', text: '#856404', label: 'Chờ xác nhận' },
    Shipping: { bg: '#DBEAFE', text: '#1E3A8A', label: 'Đang giao' },
    Paid: { bg: '#D4EDDA', text: '#155724', label: 'Đã thanh toán' },
    Completed: { bg: '#D1FAE5', text: '#065F46', label: 'Đã nhận hàng' },
    Cancelled: { bg: '#F8D7DA', text: '#721C24', label: 'Đã hủy' },
  };

  const config = statusConfig[status] || { bg: '#E2E3E5', text: '#383D41', label: status };

  return (
    <span
      className="px-3 py-1 rounded-lg font-nunito text-sm font-semibold"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}

// Order card component
function OrderCard({ order, onRefresh }) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [confirmingReceived, setConfirmingReceived] = useState(false);
  const [shopInfo, setShopInfo] = useState(null);
  const [shopLoading, setShopLoading] = useState(false);

  useEffect(() => {
    let canceled = false;

    const applyInfo = (rawInfo) => {
      if (canceled || !rawInfo) {
        return;
      }

      const sanitizedName = pickFirstNonEmpty([rawInfo.shopName]) || 'Cửa hàng';
      const sanitizedAvatar = pickFirstNonEmpty([rawInfo.shopAvatar]);
      const artisanIdValue = rawInfo.artisanId != null
        ? String(rawInfo.artisanId)
        : null;
      const shopHref = buildArtisanHref(artisanIdValue);

      const hasMeaningfulData = Boolean(
        sanitizedAvatar
        || artisanIdValue
        || (sanitizedName && sanitizedName !== 'Cửa hàng')
      );

      if (!hasMeaningfulData) {
        setShopInfo(null);
        return;
      }

      setShopInfo((prev) => {
        if (
          prev
          && prev.shopName === sanitizedName
          && prev.shopAvatar === (sanitizedAvatar || null)
          && prev.artisanId === artisanIdValue
          && prev.shopHref === shopHref
        ) {
          return prev;
        }
        return {
          shopName: sanitizedName,
          shopAvatar: sanitizedAvatar || null,
          artisanId: artisanIdValue,
          shopHref,
        };
      });
    };

    const loadShopInfo = async () => {
      if (!order || !Array.isArray(order.items) || order.items.length === 0) {
        if (!canceled) {
          setShopInfo(null);
          setShopLoading(false);
        }
        return;
      }

      const targetItem = order.items.find((current) => {
        if (!current) return false;
        const productCandidate = current.product || current.productInfo || {};
        return Boolean(
          productCandidate?.id
          ?? productCandidate?.productId
          ?? productCandidate?.productID
          ?? current.productID
          ?? current.productId
        );
      }) || order.items[0];

      const inlineProduct = targetItem?.product || targetItem?.productInfo || {};
      const initialFallback = deriveShopFallback({
        order,
        item: targetItem,
        product: inlineProduct,
      });
      let fallbackForShop = initialFallback;

      if (initialFallback.shopName || initialFallback.shopAvatar || initialFallback.artisanId) {
        applyInfo(initialFallback);
      } else {
        setShopInfo(null);
      }

      let artisanId = initialFallback.artisanId;
      const productId = pickFirstNonEmpty([
        inlineProduct?.id,
        inlineProduct?.productId,
        inlineProduct?.productID,
        targetItem?.productID,
        targetItem?.productId,
      ]);

      let loadingStarted = false;
      const startLoading = () => {
        if (!loadingStarted && !canceled) {
          setShopLoading(true);
          loadingStarted = true;
        }
      };

      if (productId) {
        startLoading();
        let productData = inlineProduct;
        if (!productData || Object.keys(productData).length === 0) {
          try {
            if (productCache.has(productId)) {
              productData = productCache.get(productId);
            } else {
              const fetchedProduct = await ProductService.getProductById(productId);
              productCache.set(productId, fetchedProduct);
              productData = fetchedProduct;
            }
          } catch (error) {
            console.error(`Không thể tải thông tin sản phẩm ${productId}:`, error);
          }
        }

        const derivedFromProduct = deriveShopFallback({
          order,
          item: targetItem,
          product: productData,
        });

        if (derivedFromProduct.shopName || derivedFromProduct.shopAvatar || derivedFromProduct.artisanId) {
          applyInfo(derivedFromProduct);
        }

        if (derivedFromProduct.artisanId) {
          artisanId = derivedFromProduct.artisanId;
        }

        if (derivedFromProduct.shopName || derivedFromProduct.shopAvatar || derivedFromProduct.artisanId) {
          fallbackForShop = derivedFromProduct;
        }
      }

      if (!artisanId) {
        if (loadingStarted && !canceled) {
          setShopLoading(false);
        }
        return;
      }

      if (shopCache.has(artisanId)) {
        const cachedShop = shopCache.get(artisanId);
        applyInfo({
          ...cachedShop,
          artisanId,
        });
        if (loadingStarted && !canceled) {
          setShopLoading(false);
        }
        return;
      }

      startLoading();

      try {
        const response = await ShopService.getShopByUserId(artisanId);
        const normalized = normalizeShopData(
          response?.shop || response?.data || response,
          {
            artisanId,
            shopName: fallbackForShop.shopName,
            shopAvatar: fallbackForShop.shopAvatar,
          },
        );
        shopCache.set(artisanId, normalized);
        applyInfo({
          ...normalized,
          artisanId,
        });
      } catch (error) {
        console.error(`Không thể tải thông tin cửa hàng ${artisanId}:`, error);
      } finally {
        if (!canceled) {
          setShopLoading(false);
        }
      }
    };

    loadShopInfo().catch((error) => {
      console.error('Không thể tải thông tin cửa hàng cho đơn hàng:', error);
      if (!canceled) {
        setShopLoading(false);
      }
    });

    return () => {
      canceled = true;
    };
  }, [order]);

  const createDate = new Date(order.createAt);
  const formattedDate = createDate.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleContinuePayment = async () => {
    try {
      toast.info('Đang xử lý thanh toán...');
      const response = await OrderService.continuePayment(order.orderNumber);
      
      if (response && response.paymentUrl) {
        // Redirect to VNPAY payment page
        window.location.href = response.paymentUrl;
      } else {
        toast.error('Không thể lấy link thanh toán. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error continuing payment:', error);
      toast.error('Có lỗi xảy ra khi tiếp tục thanh toán. Vui lòng thử lại.');
    }
  };

  const now = new Date();
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysSinceCreated = (now - createDate) / millisecondsPerDay;

  // Check if order is VNPAY and Pending
  const showPaymentButton = order.paymentType === 'VNPAY'
    && order.status === 'WaitingForPickup';
  const withinReturnWindow = order.paymentType !== 'VNPAY' || daysSinceCreated <= 2;
  const canRequestReturn = order.status === 'Shipping' && withinReturnWindow;
  const canConfirmReceived = ['Shipping', 'Paid'].includes(order.status);

  const handleConfirmReceived = async () => {
    try {
      setConfirmingReceived(true);
      await OrderService.confirmOrderReceived(order.orderNumber);
      toast.success('Cảm ơn bạn! Đơn hàng đã được xác nhận đã nhận.');
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error confirming order received:', error);
      toast.error('Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.');
    } finally {
      setConfirmingReceived(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-[1152px] bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Order Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-alata text-lg font-bold text-gray-800">Đơn hàng: {order.orderNumber}</p>
              <p className="font-nunito text-sm text-gray-600">{formattedDate}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-8 text-sm font-nunito">
            <div>
              <span className="text-gray-600">Phương thức thanh toán: </span>
              <span className="font-semibold text-gray-800">
                {order.paymentType === 'COD' ? 'Thanh toán khi nhận hàng' : 'VNPAY'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Tổng tiền: </span>
              <span className="font-alata text-lg text-primary font-bold">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>
        {shopLoading && !shopInfo && (
          <div className="px-6 py-4 bg-white flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
            <div className="flex-1 h-4 bg-gray-200 rounded w-32" />
          </div>
        )}
        {shopInfo && (
          <div className="px-6 py-4 bg-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-500 font-alata text-lg">
              {shopInfo.shopAvatar ? (
                <img
                  src={shopInfo.shopAvatar}
                  alt={shopInfo.shopName}
                  className="w-full h-full object-cover"
                />
              ) : (
                (shopInfo.shopName || 'Cửa hàng').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-alata text-base text-gray-800">{shopInfo.shopName}</span>
              {shopInfo.shopHref && (
                <Link
                  to={shopInfo.shopHref}
                  className="text-sm text-primary hover:underline font-nunito"
                >
                  Xem cửa hàng
                </Link>
              )}
            </div>
          </div>
        )}
        {order.paymentType === 'VNPAY' && order.status === 'Paid' && (
          <div className="px-6 py-3 bg-white text-sm font-nunito text-primary border-t border-gray-200">
            Đơn hàng đã được chuyển đến bộ phận giao hàng.
          </div>
        )}

        {/* Order Actions */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => setShowDetailModal(true)}
            className="px-4 py-2 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-nunito text-sm font-medium"
          >
            Xem chi tiết
          </button>
          {canRequestReturn && (
            <button
              onClick={() => setShowReturnDialog(true)}
              className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-nunito text-sm font-medium"
            >
              Hoàn đơn
            </button>
          )}
          {showPaymentButton && (
            <button
              onClick={handleContinuePayment}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors font-nunito text-sm font-medium"
            >
              Tiếp tục thanh toán
            </button>
          )}
          {canConfirmReceived && (
            <button
              onClick={handleConfirmReceived}
              disabled={confirmingReceived}
              className={`px-4 py-2 bg-emerald-600 text-white rounded-lg transition-colors font-nunito text-sm font-medium ${
                confirmingReceived ? 'opacity-60 cursor-not-allowed' : 'hover:bg-emerald-700'
              }`}
            >
              {confirmingReceived ? 'Đang xác nhận...' : 'Đã nhận được hàng'}
            </button>
          )}
          {['WaitingForPickup', 'Paid'].includes(order.status) && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="px-4 py-2 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-nunito text-sm font-medium"
            >
              Hủy đơn
            </button>
            
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderNumber={order.orderNumber}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onOrderCancelled={() => {
          // Notify parent component to refresh orders
          setShowDetailModal(false);
        }}
      />

      {/* Cancel Order Dialog - from Order Card */}
      <CancelOrderDialog
        isOpen={showCancelDialog}
        orderNumber={order.orderNumber}
        onClose={() => setShowCancelDialog(false)}
        onSuccess={() => {
          // Close dialog after successful cancellation
          setShowCancelDialog(false);
          if (onRefresh) {
            onRefresh();
          } else {
            window.location.reload();
          }
        }}
      />
      <ReturnOrderDialog
        isOpen={showReturnDialog}
        orderNumber={order.orderNumber}
        onClose={() => setShowReturnDialog(false)}
        onSuccess={() => setShowReturnDialog(false)}
      />
    </>
  );
}

export default function OrderList({ orders, onRefresh }) {
  return (
    <div className="flex flex-col gap-6 items-center pb-[120px] pt-6 px-[144px] w-full">
      {orders.map((order, idx) => (
        <OrderCard key={order.orderNumber ?? idx} order={order} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
