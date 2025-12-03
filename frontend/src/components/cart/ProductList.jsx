import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FaMinus,
  FaPlus,
  FaTrash,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';

const formatCurrency = (value, suffix) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '';
  }
  return `${Number(value).toLocaleString('vi-VN')}${suffix}`;
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
}) => {
  const { t } = useContext(LanguageContext);
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [confirmState, setConfirmState] = useState({
    open: false,
    targetId: null,
    loading: false,
    productName: '',
  });
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
                      <img
                        src={item.imageUrl || '/images/default-product.png'}
                        alt={item.name}
                        className={`w-full h-24 md:h-28 rounded-xl object-cover border ${itemUnavailable ? 'border-gray-200 grayscale' : 'border-gray-100'}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default-product.png';
                        }}
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <h3 className={`text-lg font-semibold leading-snug ${itemUnavailable ? 'text-gray-500' : 'text-[#8B4513]'}`}>
                          {item.name}
                        </h3>
                        <p className={`text-sm mt-1 flex items-center gap-2 ${itemUnavailable ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatCurrency(item.price, priceSuffix)}
                          {itemUnavailable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                              {soldOutText}
                            </span>
                          )}
                        </p>
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
              onClick={onCheckout}
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
};

export default ProductList;
