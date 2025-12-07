import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import {
  FaMinus,
  FaPlus,
  FaTrash,
  FaExclamationTriangle,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';

const formatCurrency = (value, suffix) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '';
  }
  return `${Number(value).toLocaleString('vi-VN')}${suffix}`;
};

const toPlainText = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const ProductList = ({
  items = [],
  allItems = [],
  loading = false,
  summary = null,
  updatingItemId = null,
  totalCount = null,
  onQuantityChange = () => {},
  onRemove = () => {},
  onCheckout = () => {},
  originNode = null,
}) => {
  const { t } = useContext(LanguageContext);
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [confirmState, setConfirmState] = useState({
    open: false,
    targetId: null,
    loading: false,
    productName: '',
  });
  const [checkoutConfirm, setCheckoutConfirm] = useState({ open: false, loading: false });
  const priceSuffix = t('productCard.priceSuffix');
  const soldOutLabel = t('productCard.soldOut');
  const soldOutText = soldOutLabel && soldOutLabel.includes('productCard.soldOut')
    ? 'Hết hàng'
    : soldOutLabel || 'Hết hàng';
  const unavailableNoticeLabel = t('cart.unavailableNotice');
  const unavailableNoticeText = unavailableNoticeLabel && unavailableNoticeLabel.includes('cart.unavailableNotice')
    ? 'Sản phẩm đã hết hàng hoặc ngừng kinh doanh.'
    : unavailableNoticeLabel || 'Sản phẩm đã hết hàng hoặc ngừng kinh doanh.';
  const removeConfirmLabel = t('cart.removeConfirm');
  const removeConfirmText = removeConfirmLabel && removeConfirmLabel.includes('cart.removeConfirm')
    ? 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?'
    : removeConfirmLabel || 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?';
  const removeConfirmTitleLabel = t('cart.removeConfirmTitle');
  const removeConfirmTitleText = removeConfirmTitleLabel && removeConfirmTitleLabel.includes('cart.removeConfirmTitle')
    ? 'Xóa sản phẩm'
    : removeConfirmTitleLabel || 'Xóa sản phẩm';
  const removeConfirmCancelLabel = t('common.cancel');
  const removeConfirmCancelText = removeConfirmCancelLabel && removeConfirmCancelLabel.includes('common.cancel')
    ? 'Hủy'
    : removeConfirmCancelLabel || 'Hủy';
  const removeConfirmAcceptLabel = t('common.confirm');
  const removeConfirmAcceptText = removeConfirmAcceptLabel && removeConfirmAcceptLabel.includes('common.confirm')
    ? 'Xác nhận'
    : removeConfirmAcceptLabel || 'Xác nhận';
  const removingLabel = t('cart.removing');
  const removingText = removingLabel && removingLabel.includes('cart.removing')
    ? 'Đang xử lý...'
    : removingLabel || 'Đang xử lý...';

  const translate = useCallback((key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  }, [t]);

  const resolvedOriginNode = useMemo(() => {
    if (originNode && originNode.label && originNode.href) {
      return originNode;
    }
    const fallbackLabel = translate('cart.title', 'Giỏ hàng');
    return {
      label: fallbackLabel,
      href: '/cart',
    };
  }, [originNode, translate]);

  const openRemoveConfirm = (targetId, productName) => {
    setConfirmState({
      open: true,
      targetId,
      loading: false,
      productName: productName || 'Sản phẩm',
    });
  };

  const closeRemoveConfirm = () => {
    setConfirmState({ open: false, targetId: null, loading: false, productName: '' });
  };

  const handleConfirmRemove = async () => {
    if (!confirmState.targetId) {
      closeRemoveConfirm();
      return;
    }
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      await onRemove(confirmState.targetId);
    } finally {
      closeRemoveConfirm();
    }
  };

  const isUnavailable = (item) => (
    item?.isActive === false
    || (typeof item?.stock === 'number' && Number(item.stock) <= 0)
  );

  const baseItems = allItems && allItems.length ? allItems : items;
  const availableItems = baseItems.filter((item) => !isUnavailable(item));
  const derivedSubtotal = availableItems.reduce(
    (total, item) => total + (item.price || 0) * (item.quantity || 0),
    0,
  );
  const shippingFee = summary?.shipping ?? 0;
  const subtotal = derivedSubtotal;
  const total = derivedSubtotal + shippingFee;
  const displayedCount = totalCount ?? baseItems.length;

  const renderSkeleton = () => (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className="grid grid-cols-1 md:grid-cols-[120px,1fr,120px] gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm animate-pulse"
        >
          <div className="w-full h-24 bg-gray-200 rounded-xl" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="bg-white border border-dashed border-[#D4A574] rounded-2xl py-16 px-6 text-center shadow-sm">
      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-[#FFF1E5] text-[#8B4513] text-2xl mb-4">
        🛒
      </div>
      <h2 className="text-2xl font-semibold text-[#8B4513] mb-3">{t('cart.title')}</h2>
      <p className="text-gray-600 mb-6">{t('cart.empty')}</p>
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B4513] text-white rounded-lg font-semibold hover:bg-[#D4A574] transition"
      >
        {t('cart.continueShopping')}
      </Link>
    </div>
  );

  useEffect(() => {
    if (!Array.isArray(items)) {
      setQuantityDrafts({});
      return;
    }
    const next = items.reduce((acc, current) => {
      const key = current.cartItemId || current.id;
      acc[key] = String(current.quantity ?? 1);
      return acc;
    }, {});
    setQuantityDrafts(next);
  }, [items]);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-gray-500 mt-1">
            {displayedCount > 0
              ? t('cart.itemsCount', { count: displayedCount })
              : t('cart.empty')}
          </p>
        </div>
        {items.length > 0 && (
          <span className="inline-flex items-center gap-2 bg-[#FFF1E5] text-[#8B4513] px-4 py-2 rounded-full border border-[#D4A574]/50">
            🧺 {t('cart.subtotal')}:{' '}
            <strong>{formatCurrency(subtotal, priceSuffix)}</strong>
          </span>
        )}
      </header>

      {loading ? (
        renderSkeleton()
      ) : items.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-5">
            {items.map((item) => {
              const isUpdating = updatingItemId === item.id || updatingItemId === item.cartItemId;
              const subtotalPerItem = (item.price || 0) * (item.quantity || 0);
              const itemUnavailable = isUnavailable(item);
              const draftKey = item.cartItemId || item.id;
              const draftValue = quantityDrafts[draftKey] ?? String(item.quantity ?? 1);
              const product = item.product || {};
              const productId = item.productId || product.id || product.productId;
              const productDetailHref = productId ? `/product-detail/${productId}` : null;
              const productDetailState = productDetailHref
                ? { fromProductList: resolvedOriginNode }
                : undefined;
              const summarySource = product.shortDescription
                || product.description
                || product.summary
                || product.content
                || '';
              const summaryText = toPlainText(summarySource);
              const trimmedSummary = summaryText.length > 200
                ? `${summaryText.slice(0, 200).trim()}…`
                : summaryText;
              const artisanName = product.shop?.shopName
                || product.shop?.name
                || product.artisanName
                || product.artisan?.name
                || product.ownerName
                || product.owner?.name
                || product.brand
                || '';
              const categoryName = product.category?.name
                || product.collection?.name
                || product.categoryName
                || '';
              const sku = product.sku || product.skuCode || product.code || product.productCode || '';
              const weight = product.weight || product.netWeight || '';
              const metadata = [];
              if (artisanName) {
                metadata.push({
                  key: 'artisan',
                  label: translate('cart.product.artisan', 'Nghệ nhân / Cửa hàng'),
                  value: artisanName,
                });
              }
              if (categoryName) {
                metadata.push({
                  key: 'category',
                  label: translate('cart.product.category', 'Danh mục'),
                  value: categoryName,
                });
              }
              if (sku) {
                metadata.push({
                  key: 'sku',
                  label: translate('cart.product.sku', 'Mã sản phẩm'),
                  value: sku,
                });
              }
              if (weight) {
                metadata.push({
                  key: 'weight',
                  label: translate('cart.product.weight', 'Trọng lượng'),
                  value: `${weight}${typeof weight === 'number' ? 'g' : ''}`,
                });
              }

              return (
                <article
                  key={item.id}
                  className={`border rounded-2xl shadow-sm p-4 md:p-5 transition ${
                    itemUnavailable
                      ? 'bg-gray-100 border-gray-300 opacity-80'
                      : 'bg-white border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="md:w-32">
                      {productDetailHref ? (
                        <Link
                          to={productDetailHref}
                          state={productDetailState}
                          className="block rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B4513]/40"
                        >
                          <img
                            src={item.imageUrl || '/images/default-product.png'}
                            alt={item.name}
                            className={`w-full h-24 md:h-28 object-cover border ${itemUnavailable ? 'border-gray-200 grayscale' : 'border-gray-100'}`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/default-product.png';
                            }}
                          />
                        </Link>
                      ) : (
                        <img
                          src={item.imageUrl || '/images/default-product.png'}
                          alt={item.name}
                          className={`w-full h-24 md:h-28 rounded-xl object-cover border ${itemUnavailable ? 'border-gray-200 grayscale' : 'border-gray-100'}`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/default-product.png';
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between gap-4">
                      <div>
                        {productDetailHref ? (
                          <Link
                            to={productDetailHref}
                            state={productDetailState}
                            className={`block text-lg font-semibold leading-snug transition-colors ${
                              itemUnavailable
                                ? 'text-gray-500'
                                : 'text-[#8B4513] hover:text-[#B73E3E]'
                            }`}
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <h3 className={`text-lg font-semibold leading-snug ${itemUnavailable ? 'text-gray-500' : 'text-[#8B4513]'}`}>
                            {item.name}
                          </h3>
                        )}
                        <p className={`text-sm mt-1 flex items-center gap-2 ${itemUnavailable ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatCurrency(item.price, priceSuffix)}
                          {itemUnavailable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                              {soldOutText}
                            </span>
                          )}
                        </p>
                        {trimmedSummary && (
                          <p className={`mt-2 text-sm leading-relaxed ${itemUnavailable ? 'text-gray-400' : 'text-gray-600'}`}>
                            {trimmedSummary}
                          </p>
                        )}
                        {metadata.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                            {metadata.map((meta) => (
                              <li key={`${item.id}-${meta.key}`} className="flex items-center gap-1 text-gray-500">
                                <span className="uppercase tracking-wide text-[11px] text-gray-400">{meta.label}:</span>
                                <span className={`text-gray-600 ${itemUnavailable ? 'text-gray-400' : ''}`}>
                                  {meta.value}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {itemUnavailable && (
                          <p className="text-xs text-red-500 mt-2">
                            {unavailableNoticeText}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="inline-flex items-center gap-2 bg-[#FFFBF0] rounded-full px-3 py-2 border border-[#D4A574]/50">
                          <button
                            type="button"
                            onClick={async () => {
                              if (isUpdating || itemUnavailable) return;
                              const next = (item.quantity || 0) - 1;
                              const targetId = item.cartItemId || item.id;
                              if (next <= 0) {
                                openRemoveConfirm(targetId, item.name);
                              } else {
                                await onQuantityChange(targetId, next);
                              }
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-full border border-transparent transition ${
                              isUpdating || itemUnavailable
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-[#8B4513] hover:bg-white hover:border-[#D4A574]'
                            }`}
                            disabled={isUpdating || itemUnavailable}
                          >
                            <FaMinus size={12} />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={draftValue}
                            onChange={(event) => {
                              if (isUpdating || itemUnavailable) return;
                              const raw = event.target.value;
                              const sanitized = raw.replace(/[^0-9]/g, '');
                              setQuantityDrafts((prev) => ({ ...prev, [draftKey]: sanitized }));
                            }}
                            onBlur={async () => {
                              if (isUpdating || itemUnavailable) return;
                              const raw = quantityDrafts[draftKey];
                              if (raw === undefined) return;
                              if (raw === '') {
                                setQuantityDrafts((prev) => ({ ...prev, [draftKey]: String(item.quantity ?? 1) }));
                                return;
                              }
                              const parsed = Number(raw);
                              const result = await onQuantityChange(draftKey, parsed, { manual: true });
                              if (!result?.success) {
                                const fallback = result?.quantity ?? item.quantity ?? 1;
                                setQuantityDrafts((prev) => ({ ...prev, [draftKey]: String(fallback) }));
                              } else {
                                const normalizedDisplay = String(result.quantity ?? item.quantity ?? 1);
                                setQuantityDrafts((prev) => ({ ...prev, [draftKey]: normalizedDisplay }));
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                event.currentTarget.blur();
                              }
                            }}
                            className={`w-14 text-center font-semibold text-[#8B4513] bg-transparent border border-transparent focus:border-[#D4A574] focus:bg-white focus:outline-none rounded-md py-1 ${
                              isUpdating || itemUnavailable ? 'text-gray-300 cursor-not-allowed' : ''
                            }`}
                            disabled={isUpdating || itemUnavailable}
                          />
                            <button
                              type="button"
                              onClick={async () => {
                              if (isUpdating || itemUnavailable) return;
                               const targetId = item.cartItemId || item.id;
                               await onQuantityChange(targetId, (item.quantity || 0) + 1);
                             }}
                              className={`w-8 h-8 flex items-center justify-center rounded-full border border-transparent transition ${
                              isUpdating || itemUnavailable
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-[#8B4513] hover:bg-white hover:border-[#D4A574]'
                              }`}
                              disabled={isUpdating || itemUnavailable}
                            >
                              <FaPlus size={12} />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4 sm:justify-end">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{t('cart.headerSubtotal')}</p>
                            <p className={`text-lg font-semibold ${itemUnavailable ? 'text-gray-500' : 'text-[#8B4513]'}`}>
                              {formatCurrency(subtotalPerItem, priceSuffix)}
                            </p>
                          </div>
                          {productDetailHref && (
                            <Link
                              to={productDetailHref}
                              state={productDetailState}
                              className="inline-flex items-center gap-2 text-sm font-medium text-[#8B4513] hover:text-[#B73E3E] transition"
                            >
                              <FaExternalLinkAlt size={12} />
                              <span>{translate('cart.viewDetail', 'Xem chi tiết')}</span>
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (isUpdating) return;
                              const targetId = item.cartItemId || item.id;
                              openRemoveConfirm(targetId, item.name);
                            }}
                            className={`inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition ${
                              isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={isUpdating}
                          >
                            <FaTrash size={14} />
                            <span>{t('cart.remove')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isUpdating && (
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-[#8B4513] bg-[#FFF1E5] px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-[#8B4513] rounded-full animate-ping" />
                      {t('cart.updating')}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <aside className="bg-white border border-[#efe7db] rounded-2xl shadow-xl p-6 h-fit">
            <h2 className="text-xl font-semibold text-[#8B4513] mb-6">{t('cart.summaryTitle')}</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>{t('cart.subtotal')}</span>
                <span className="font-semibold text-[#8B4513]">
                  {formatCurrency(subtotal, priceSuffix)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-semibold text-[#8B4513]">
                <span>{t('cart.total')}</span>
                <span>{formatCurrency(total, priceSuffix)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCheckoutConfirm({ open: true, loading: false })}
              className="mt-6 w-full bg-[#8B4513] text-white rounded-lg py-3 font-semibold hover:bg-[#D4A574] transition"
            >
              {t('cart.checkout')}
            </button>
          </aside>
        </div>
      )}

      {confirmState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#8B4513]">
              <FaExclamationTriangle className="text-2xl" />
              <h3 className="text-lg font-semibold">{removeConfirmTitleText}</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {`${removeConfirmText} (${confirmState.productName})`}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeRemoveConfirm}
                disabled={confirmState.loading}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition disabled:opacity-60"
              >
                {removeConfirmCancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={confirmState.loading}
                className="px-4 py-2 rounded-lg bg-[#8B4513] text-white font-semibold hover:bg-[#D4A574] transition disabled:opacity-70"
              >
                {confirmState.loading ? removingText : removeConfirmAcceptText}
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3 text-[#8B4513]">
              <FaExclamationTriangle className="text-2xl" />
              <h3 className="text-lg font-semibold">
                {translate('cart.checkoutConfirmTitle', 'Xác nhận đặt hàng')}
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {translate(
                'cart.checkoutConfirmMessage',
                'Bạn có chắc chắn muốn tiến hành đặt hàng với các sản phẩm hiện có trong giỏ không?'
              )}
            </p>
            <div className="bg-[#FFF8EE] border border-[#F3D5B5] rounded-xl p-4 space-y-3 text-sm text-gray-600">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-[#8B4513]/70 mb-1">
                  {translate('cart.checkoutConfirmProducts', 'Sản phẩm trong đơn hàng')}
                </span>
                <ul className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {items.map((item) => (
                    <li
                      key={`checkout-summary-${item.id}`}
                      className="flex items-center gap-3 text-gray-600 bg-white/70 rounded-lg px-2 py-1.5 border border-[#F3D5B5]/60"
                    >
                      <img
                        src={item.imageUrl || item.image || '/images/default-product.png'}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-[#F3D5B5]"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = '/images/default-product.png';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-[#8B4513]">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {translate('cart.checkoutConfirmQuantity', 'Số lượng')}
                          {`: ${item.quantity || 1}`}
                        </p>
                      </div>
                      <span className="text-[#8B4513] font-semibold flex-shrink-0 text-sm">
                        {formatCurrency((item.price || 0) * (item.quantity || 0), priceSuffix)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between">
                <span>{t('cart.subtotal')}</span>
                <strong className="text-[#8B4513]">{formatCurrency(subtotal, priceSuffix)}</strong>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#8B4513]">
                <span>{t('cart.total')}</span>
                <span>{formatCurrency(total, priceSuffix)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {translate(
                'cart.checkoutConfirmNotice',
                'Bạn sẽ được chuyển đến trang thanh toán để xác nhận thông tin giao hàng và phương thức thanh toán.'
              )}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutConfirm({ open: false, loading: false })}
                disabled={checkoutConfirm.loading}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition disabled:opacity-60"
              >
                {removeConfirmCancelText}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (checkoutConfirm.loading) return;
                  setCheckoutConfirm({ open: true, loading: true });
                  try {
                    await onCheckout();
                    setCheckoutConfirm({ open: false, loading: false });
                  } catch (error) {
                    console.error('Checkout error:', error);
                    setCheckoutConfirm({ open: false, loading: false });
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#8B4513] text-white font-semibold hover:bg-[#D4A574] transition disabled:opacity-70"
              >
                {checkoutConfirm.loading
                  ? translate('cart.checkoutConfirmProcessing', 'Đang chuyển hướng...')
                  : translate('cart.checkoutConfirmAccept', 'Tiếp tục thanh toán')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

ProductList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      cartItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      image: PropTypes.string,
      price: PropTypes.number,
      quantity: PropTypes.number,
      product: PropTypes.shape({}),
    }),
  ),
  loading: PropTypes.bool,
  summary: PropTypes.shape({
    subtotal: PropTypes.number,
    shipping: PropTypes.number,
    total: PropTypes.number,
  }),
  allItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      price: PropTypes.number,
      quantity: PropTypes.number,
    }),
  ),
  updatingItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onQuantityChange: PropTypes.func,
  onRemove: PropTypes.func,
  onCheckout: PropTypes.func,
  originNode: PropTypes.shape({
    label: PropTypes.string,
    href: PropTypes.string,
    state: PropTypes.shape({}),
  }),
};

export default ProductList;
