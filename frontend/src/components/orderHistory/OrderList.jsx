import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import OrderDetailModal from './OrderDetailModal';
import CancelOrderDialog from './CancelOrderDialog';
import ReturnOrderDialog from './ReturnOrderDialog';
import { OrderService } from '../../services/modules/orders/orderService';
import { toast } from 'react-toastify';
import { ProductService } from '../../services/modules/products/productService';
import { ShopService } from '../../services/modules/shop/shopService';
import { resolveProductArtisanId } from '../../utils/productOwnership';
import { LanguageContext } from '../../context/LanguageContext';
import { UserContext } from '../../context/UserContext';

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

const toAbsoluteUrl = (value) => {
  if (!value) return '';
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    return '';
  }
  if (/^(?:https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }
  const base = (
    (process.env.REACT_APP_CDN_BASE_URL
      || process.env.REACT_APP_STORAGE_BASE_URL
      || process.env.REACT_APP_API_BASE_URL
      || '')
  ).trim();
  if (!base) {
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
  const normalizedBase = base.replace(/\/$/, '');
  const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`;
  return `${normalizedBase}${normalizedPath}`;
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

const resolveProductImage = (product) => {
  if (!product) return '';
  const candidate = pickFirstNonEmpty([
    Array.isArray(product.images) && product.images[0],
    Array.isArray(product.images) && product.images[0]?.url,
    Array.isArray(product.images) && product.images[0]?.imageUrl,
    Array.isArray(product.images) && product.images[0]?.imageURL,
    Array.isArray(product.images) && product.images[0]?.thumb,
    product.image,
    product.imageUrl,
    product.imageURL,
    product.thumbnail,
    product.thumb,
  ]);
  return toAbsoluteUrl(candidate);
};

const buildArtisanHref = (artisanId) => {
  if (!artisanId) return null;
  return `/artisan-shop?artisanId=${encodeURIComponent(artisanId)}`;
};

// Status badge component
function StatusBadge({ status }) {
  const { t } = useContext(LanguageContext);
  const STATUS_STYLES = {
    WaitingForPickup: { bg: '#FFF3CD', text: '#856404' },
    Shipping: { bg: '#DBEAFE', text: '#1E3A8A' },
    Paid: { bg: '#D4EDDA', text: '#155724' },
    Completed: { bg: '#D1FAE5', text: '#065F46' },
    Cancelled: { bg: '#F8D7DA', text: '#721C24' },
  };

  const DEFAULT_STATUS_STYLE = { bg: '#E2E3E5', text: '#383D41' };
  const style = STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;
  const rawLabel = t(`orderHistory.statuses.${status}`);
  const label = rawLabel && !rawLabel.includes('orderHistory.statuses.')
    ? rawLabel
    : t('orderHistory.statuses.default');

  return (
    <span
      className="px-3 py-1 rounded-lg font-nunito text-sm font-semibold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {label}
    </span>
  );
}

// Order card component
function OrderCard({ order, onRefresh }) {
  const { t, language } = useContext(LanguageContext);
  const defaultShopLabelRaw = t('orderHistory.list.defaultShopName');
  const defaultShopLabel = defaultShopLabelRaw && !defaultShopLabelRaw.includes('orderHistory.list.defaultShopName')
    ? defaultShopLabelRaw
    : 'Cửa hàng';
  const locale = useMemo(() => (language === 'vi' ? 'vi-VN' : 'en-US'), [language]);
  const isDefaultShopName = useCallback(
    (value) => {
      if (!value) return true;
      const normalized = String(value).trim();
      return normalized === 'Cửa hàng'
        || normalized === 'Shop'
        || normalized === defaultShopLabel;
    },
    [defaultShopLabel],
  );

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [confirmingReceived, setConfirmingReceived] = useState(false);
  const [shopInfo, setShopInfo] = useState(null);
  const [shopLoading, setShopLoading] = useState(false);
  const { userInfo } = useContext(UserContext);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackModalStage, setFeedbackModalStage] = useState('prompt');
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [feedbackModalOrder, setFeedbackModalOrder] = useState(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const feedbackProductCache = useRef(new Map());

  const deriveFeedbackItems = useCallback((targetOrder) => {
    const items = Array.isArray(targetOrder?.items) ? targetOrder.items : [];
    return items.map((item, index) => {
      const product = item?.product || item?.productInfo || {};
      const productId = pickFirstNonEmpty([
        product?.id,
        product?.productId,
        product?.productID,
        item?.productId,
        item?.productID,
      ]);
      const name = pickFirstNonEmpty([
        product?.name,
        product?.productName,
        product?.title,
        product?.displayName,
        item?.productName,
        item?.name,
      ]) || `Sản phẩm ${index + 1}`;
      const unitPrice = Number(item?.unitPrice ?? item?.price ?? item?.totalPrice ?? 0);
      const quantity = Number(item?.quantity ?? item?.qty ?? 1);
      const priceLabel = unitPrice > 0 ? formatCurrency(unitPrice) : '';
      const productImage = pickFirstNonEmpty([
        item?.productImage,
        item?.productImageUrl,
        item?.productImageURL,
        item?.image,
        item?.imageUrl,
        item?.imageURL,
        Array.isArray(product?.images) && product.images[0]?.url,
        Array.isArray(product?.images) && product.images[0]?.imageUrl,
        Array.isArray(product?.images) && product.images[0]?.imageURL,
        Array.isArray(product?.images) && product.images[0]?.thumb,
        product?.image,
        product?.imageUrl,
        product?.imageURL,
        product?.thumbnail,
        product?.thumb,
      ]);
      return {
        id: `${targetOrder?.orderNumber || 'order'}-${productId || index}`,
        productId: productId || null,
        name,
        productImage,
        quantity,
        priceLabel,
        label: name,
        selected: Boolean(productId),
        rating: 5,
        comment: '',
      };
    });
  }, []);

  const loadFeedbackProductDetails = useCallback(async (targetOrder) => {
    if (!targetOrder) return;
    const ids = Array.from(new Set(
      (Array.isArray(targetOrder.items) ? targetOrder.items : [])
        .map((item) => pickFirstNonEmpty([
          item?.productId,
          item?.productID,
          item?.product?.id,
          item?.product?.productId,
        ]))
        .filter(Boolean),
    ));
    if (!ids.length) return;

    const details = new Map();
    await Promise.all(ids.map(async (productId) => {
      if (feedbackProductCache.current.has(productId)) {
        details.set(productId, feedbackProductCache.current.get(productId));
        return;
      }
      try {
        const productData = await ProductService.getProductById(productId);
        feedbackProductCache.current.set(productId, productData);
        details.set(productId, productData);
      } catch (error) {
        console.error('Unable to load product data for feedback:', productId, error);
      }
    }));

    if (!details.size) return;

    setFeedbackItems((prev) => prev.map((item) => {
      if (!item.productId) return item;
      const productData = details.get(item.productId);
      if (!productData) return item;
      const updatedName = pickFirstNonEmpty([
        productData.name,
        productData.productName,
        productData.displayName,
        productData.title,
        item.name,
      ]);
      return {
        ...item,
        name: updatedName || item.name,
        productImage: resolveProductImage(productData) || item.productImage,
      };
    }));
  }, [resolveProductImage]);

  const openFeedbackModal = useCallback((targetOrder) => {
    if (!targetOrder) {
      return;
    }
    setFeedbackModalOrder(targetOrder);
    setFeedbackItems(deriveFeedbackItems(targetOrder));
    setFeedbackModalStage('prompt');
    setFeedbackModalOpen(true);
    setFeedbackSubmitting(false);
    loadFeedbackProductDetails(targetOrder);
  }, [deriveFeedbackItems, loadFeedbackProductDetails]);

  const closeFeedbackModal = useCallback(() => {
    setFeedbackModalOpen(false);
    setFeedbackModalStage('prompt');
    setFeedbackItems([]);
    setFeedbackModalOrder(null);
    setFeedbackSubmitting(false);
  }, []);

  const confirmOrderReceived = useCallback(async (orderNumber, options = {}) => {
    if (!orderNumber) {
      return false;
    }
    const { refresh = true } = options;
    setConfirmingReceived(true);
    try {
      await OrderService.confirmOrderReceived(orderNumber);
      toast.success(t('orderHistory.list.toast.confirmSuccess'));
      if (refresh) {
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      }
      return true;
    } catch (error) {
      console.error('Error confirming order received:', error);
      toast.error(t('orderHistory.list.toast.confirmError'));
      return false;
    } finally {
      setConfirmingReceived(false);
    }
  }, [onRefresh, t]);

  const handleFeedbackDecline = useCallback(async () => {
    if (!feedbackModalOrder) {
      closeFeedbackModal();
      return;
    }
    await confirmOrderReceived(feedbackModalOrder.orderNumber);
    closeFeedbackModal();
  }, [confirmOrderReceived, feedbackModalOrder, closeFeedbackModal]);

  const handleFeedbackItemChange = useCallback((index, field, value) => {
    setFeedbackItems((prev) => prev.map((item, idx) => (
      idx === index
        ? { ...item, [field]: value }
        : item
    )));
  }, []);

  const handleSubmitFeedback = useCallback(async () => {
    if (!feedbackModalOrder) {
      return;
    }
    const selectedItems = feedbackItems.filter((item) => item.selected && item.productId);
    if (selectedItems.length === 0) {
      toast.info('Vui lòng chọn ít nhất một sản phẩm để đánh giá.');
      return;
    }
    const userId = userInfo?.userID || userInfo?.userId || userInfo?.id;
    if (!userId) {
      toast.error('Không thể gửi đánh giá khi chưa đăng nhập.');
      return;
    }
    setFeedbackSubmitting(true);
    try {
      await confirmOrderReceived(feedbackModalOrder.orderNumber, { refresh: false });
      await Promise.all(selectedItems.map((item) => ProductService.submitFeedback(item.productId, userId, {
        rating: Number(item.rating) || 5,
        comment: item.comment?.trim() || ' ',
      })));
      toast.success('Cảm ơn bạn đã gửi đánh giá.');
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
      closeFeedbackModal();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error?.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setFeedbackSubmitting(false);
    }
  }, [closeFeedbackModal, confirmOrderReceived, feedbackItems, feedbackModalOrder, onRefresh, userInfo]);
  useEffect(() => {
    let canceled = false;

    const applyInfo = (rawInfo) => {
      if (canceled || !rawInfo) {
        return;
      }

      let sanitizedName = pickFirstNonEmpty([rawInfo.shopName]);
      if (isDefaultShopName(sanitizedName)) {
        sanitizedName = defaultShopLabel;
      }
      const sanitizedAvatar = pickFirstNonEmpty([rawInfo.shopAvatar]);
      const artisanIdValue = rawInfo.artisanId != null
        ? String(rawInfo.artisanId)
        : null;
      const shopHref = buildArtisanHref(artisanIdValue);

      const hasMeaningfulData = Boolean(
        sanitizedAvatar
        || artisanIdValue
        || !isDefaultShopName(sanitizedName)
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
  }, [order, defaultShopLabel, isDefaultShopName]);

  const createDate = new Date(order.createAt);
  const formattedDate = createDate.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleContinuePayment = async () => {
    try {
      toast.info(t('orderHistory.list.toast.continueProcessing'));
      const response = await OrderService.continuePayment(order.orderNumber);
      
      if (response && response.paymentUrl) {
        // Redirect to VNPAY payment page
        window.location.href = response.paymentUrl;
      } else {
        toast.error(t('orderHistory.list.toast.continueMissingUrl'));
      }
    } catch (error) {
      console.error('Error continuing payment:', error);
      toast.error(t('orderHistory.list.toast.continueError'));
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

  return (
    <>
      <div className="w-full max-w-[1152px] bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Order Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-alata text-lg font-bold text-gray-800">
                {t('orderHistory.list.orderLabel', { orderNumber: order.orderNumber })}
              </p>
              <p className="font-nunito text-sm text-gray-600">{formattedDate}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-8 text-sm font-nunito">
            <div>
              <span className="text-gray-600">{t('orderHistory.list.paymentMethodLabel')}: </span>
              <span className="font-semibold text-gray-800">
                {order.paymentType === 'COD'
                  ? t('orderHistory.list.paymentMethodCOD')
                  : t('orderHistory.list.paymentMethodVNPAY')}
              </span>
            </div>
            <div>
              <span className="text-gray-600">{t('orderHistory.list.totalLabel')}: </span>
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
                (shopInfo.shopName || defaultShopLabel).charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-alata text-base text-gray-800">{shopInfo.shopName}</span>
              {shopInfo.shopHref && (
                <Link
                  to={shopInfo.shopHref}
                  className="text-sm text-primary hover:underline font-nunito"
                >
                  {t('orderHistory.list.viewShop')}
                </Link>
              )}
            </div>
          </div>
        )}
        {order.paymentType === 'VNPAY' && order.status === 'Paid' && (
          <div className="px-6 py-3 bg-white text-sm font-nunito text-primary border-t border-gray-200">
            {t('orderHistory.list.shippedNotice')}
          </div>
        )}

        {/* Order Actions */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => setShowDetailModal(true)}
            className="px-4 py-2 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-nunito text-sm font-medium"
          >
            {t('orderHistory.list.actions.viewDetail')}
          </button>
          {canRequestReturn && (
            <button
              onClick={() => setShowReturnDialog(true)}
              className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-nunito text-sm font-medium"
            >
              {t('orderHistory.list.actions.requestReturn')}
            </button>
          )}
          {showPaymentButton && (
            <button
              onClick={handleContinuePayment}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors font-nunito text-sm font-medium"
            >
              {t('orderHistory.list.actions.continuePayment')}
            </button>
          )}
          {canConfirmReceived && (
            <button
              onClick={() => openFeedbackModal(order)}
              disabled={confirmingReceived}
              className={`px-4 py-2 bg-emerald-600 text-white rounded-lg transition-colors font-nunito text-sm font-medium ${
                confirmingReceived ? 'opacity-60 cursor-not-allowed' : 'hover:bg-emerald-700'
              }`}
            >
              {confirmingReceived
                ? t('orderHistory.list.actions.confirming')
                : t('orderHistory.list.actions.confirmReceived')}
            </button>
          )}
          {['WaitingForPickup', 'Paid'].includes(order.status) && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="px-4 py-2 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-nunito text-sm font-medium"
            >
              {t('orderHistory.list.actions.cancelOrder')}
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
        onClose={() => setShowReturnDialog(false)}
        orderNumber={order.orderNumber}
        onSuccess={() => setShowReturnDialog(false)}
      />
      {feedbackModalOpen && feedbackModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {feedbackModalStage === 'prompt' ? 'Đã nhận hàng' : 'Đánh giá sản phẩm'}
                </h3>
                <p className="text-sm text-gray-500">
                  {feedbackModalStage === 'prompt'
                    ? 'Bạn có muốn để lại đánh giá cho đơn hàng này không?'
                    : 'Chọn sản phẩm bạn muốn đánh giá và viết nhận xét.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeFeedbackModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {feedbackModalStage === 'prompt' ? (
              <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                  onClick={closeFeedbackModal}
                >
                  Để sau
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
                  onClick={handleFeedbackDecline}
                  disabled={confirmingReceived}
                >
                  Không, chỉ xác nhận
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-opacity-90 transition"
                  onClick={() => setFeedbackModalStage('form')}
                >
                  Có, tôi muốn đánh giá
                </button>
              </div>
            ) : (
              <>
            <div className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
              {feedbackItems.map((item, index) => (
                <div key={item.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.name}
                          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-200" />
                      )}
                      <div className="space-y-0.5 text-sm">
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {item.quantity ? <span>Số lượng: {item.quantity}</span> : null}
                          {item.priceLabel ? <span>Đơn giá: {item.priceLabel}</span> : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 text-xs text-gray-600">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(event) => handleFeedbackItemChange(index, 'selected', event.target.checked)}
                          className="h-4 w-4 rounded border"
                        />
                        <span className="font-semibold text-gray-800">Đánh giá sản phẩm này</span>
                      </label>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>Đánh giá:</span>
                        <select
                          value={item.rating}
                          onChange={(event) => handleFeedbackItemChange(index, 'rating', Number(event.target.value))}
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>
                              {value} sao
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={item.comment}
                    placeholder="Chia sẻ cảm nhận của bạn..."
                    onChange={(event) => handleFeedbackItemChange(index, 'comment', event.target.value)}
                    className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    rows={3}
                  />
                </div>
              ))}
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackModalStage('prompt')}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                    disabled={feedbackSubmitting}
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitFeedback}
                    disabled={feedbackSubmitting || confirmingReceived}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {feedbackSubmitting ? 'Đang gửi...' : 'Gửi đánh giá và xác nhận'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
