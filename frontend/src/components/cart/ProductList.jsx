import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { resolveProductArtisanId } from '../../utils/productOwnership';
import { ShopService } from '../../services/modules/shop/shopService';

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
  const [checkoutConfirm, setCheckoutConfirm] = useState({
    open: false,
    loading: false,
    items: [],
    context: null,
  });
  const [shopDetails, setShopDetails] = useState({});
  const pendingShopFetchRef = useRef(new Set());

  const [selectedItemIds, setSelectedItemIds] = useState(() => new Set());
  const selectionInitializedRef = useRef(false);
  const knownItemIdsRef = useRef(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  const getItemKey = useCallback((item) => (
    item && (item.cartItemId != null || item.id != null)
      ? String(item.cartItemId ?? item.id)
      : ''
  ), []);

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

  const normalizeShopData = useCallback((raw, fallback = {}) => {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const pickFirst = (values) => values.find((value) => {
      if (value === null || value === undefined) return false;
      const stringValue = String(value).trim();
      return stringValue.length > 0;
    });

    const shopName = pickFirst([
      raw.shopName,
      raw.name,
      raw.displayName,
      raw.title,
      fallback.shopName,
      translate('cart.shopFallback', 'Cửa hàng'),
    ]);

    const shopAvatar = pickFirst([
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
      null,
    ]) || null;

    const shopHref = pickFirst([
      raw.shopLink,
      raw.shopHref,
      raw.href,
      raw.url,
      fallback.shopHref,
    ]) || fallback.shopHref || null;

    return {
      shopName: shopName || fallback.shopName || translate('cart.shopFallback', 'Cửa hàng'),
      shopAvatar,
      shopHref,
    };
  }, [translate]);

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

  const selectableItemIds = useMemo(
    () => (
      items
        .filter((item) => !isUnavailable(item))
        .map((item) => getItemKey(item))
        .filter((key) => Boolean(key))
    ),
    [items, getItemKey],
  );

  const allSelected = selectableItemIds.length > 0
    && selectableItemIds.every((id) => selectedItemIds.has(id));
  const partiallySelected = selectedItemIds.size > 0 && !allSelected;

  const selectedItems = useMemo(
    () => items.filter((item) => {
      const key = getItemKey(item);
      if (!key) return false;
      if (isUnavailable(item)) return false;
      return selectedItemIds.has(key);
    }),
    [items, selectedItemIds, getItemKey],
  );

  const selectedQuantity = useMemo(
    () => selectedItems.reduce(
      (totalUnits, current) => totalUnits + Number(current.quantity || 0),
      0,
    ),
    [selectedItems],
  );

  const selectedSubtotal = useMemo(
    () => selectedItems.reduce(
      (totalPrice, current) => totalPrice + (current.price || 0) * (current.quantity || 0),
      0,
    ),
    [selectedItems],
  );

  const selectionActive = selectedItems.length > 0;
  const summaryQuantity = selectionActive ? selectedQuantity : 0;
  const summarySubtotal = selectionActive ? selectedSubtotal : 0;
  const summaryTotal = summarySubtotal + shippingFee;

  const toggleAllSelection = useCallback((checked) => {
    if (!checked) {
      setSelectedItemIds(new Set());
      return;
    }

    const next = new Set();
    const known = knownItemIdsRef.current instanceof Set
      ? new Set(knownItemIdsRef.current)
      : new Set();

    items.forEach((item) => {
      const key = getItemKey(item);
      if (!key || isUnavailable(item)) return;
      next.add(key);
      known.add(key);
    });

    knownItemIdsRef.current = known;
    selectionInitializedRef.current = true;
    setSelectedItemIds(next);
  }, [items, getItemKey]);

  const toggleItemSelection = useCallback((item, checked) => {
    const key = getItemKey(item);
    if (!key) return;

    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });

    const known = knownItemIdsRef.current instanceof Set
      ? new Set(knownItemIdsRef.current)
      : new Set();
    known.add(key);
    knownItemIdsRef.current = known;
  }, [getItemKey]);

  const handleShopSelectionChange = useCallback((shopItems, checked) => {
    if (!Array.isArray(shopItems)) {
      return;
    }

    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      shopItems.forEach((shopItem) => {
        const key = getItemKey(shopItem);
        if (!key || isUnavailable(shopItem)) return;
        if (checked) {
          next.add(key);
        } else {
          next.delete(key);
        }
      });
      return next;
    });

    const known = knownItemIdsRef.current instanceof Set
      ? new Set(knownItemIdsRef.current)
      : new Set();
    shopItems.forEach((shopItem) => {
      const key = getItemKey(shopItem);
      if (key) {
        known.add(key);
      }
    });
    knownItemIdsRef.current = known;
  }, [getItemKey]);

  const openCheckoutForItems = useCallback((selectedItems, context = null) => {
    setCheckoutConfirm({
      open: true,
      loading: false,
      items: Array.isArray(selectedItems) ? selectedItems : [],
      context,
    });
  }, []);

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

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) {
      setSelectedItemIds(new Set());
      selectionInitializedRef.current = false;
      knownItemIdsRef.current = new Set();
      setExpandedDescriptions({});
      return;
    }

    setSelectedItemIds((prev) => {
      const previous = new Set(prev);
      const next = new Set();
      const known = knownItemIdsRef.current instanceof Set
        ? new Set(knownItemIdsRef.current)
        : new Set();
      const shouldDefaultSelect = !selectionInitializedRef.current;

      items.forEach((item) => {
        const key = getItemKey(item);
        if (!key) {
          return;
        }

        const isNew = !known.has(key);
        if (!isUnavailable(item) && (shouldDefaultSelect || previous.has(key) || isNew)) {
          next.add(key);
        }
        known.add(key);
      });

      knownItemIdsRef.current = known;
      selectionInitializedRef.current = true;
      return next;
    });
  }, [items, getItemKey]);

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const validKeys = new Set(
      items
        .map((item) => getItemKey(item))
        .filter((key) => Boolean(key)),
    );

    setExpandedDescriptions((prev) => {
      if (!prev || typeof prev !== 'object') {
        return {};
      }
      const next = {};
      validKeys.forEach((key) => {
        if (prev[key]) {
          next[key] = true;
        }
      });
      return next;
    });
  }, [items, getItemKey]);

  const resolveShopInfo = useCallback((item) => {
    const product = item?.product || {};
    const artisanIdRaw = resolveProductArtisanId(product);
    const artisanId = artisanIdRaw != null ? String(artisanIdRaw) : null;
    const shop = product.shop || product.store || product.artisan || {};
    const candidateNames = [
      shop.shopName,
      shop.name,
      product.shopName,
      product.shop?.name,
      product.artisanName,
      product.ownerName,
      product.brand,
    ];
    const shopName = (candidateNames.find((value) => value && String(value).trim())
      || translate('cart.shopFallback', 'Cửa hàng'));

    const avatarCandidates = [
      shop.logoUrl,
      shop.avatarUrl,
      shop.imageUrl,
      shop.image,
      product.shopImage,
      product.ownerAvatar,
      product.avatar,
    ];
    const shopAvatar = avatarCandidates.find((value) => value) || null;

    const fallbackOwner = (
      shop.id
      ?? shop.userId
      ?? shop.userID
      ?? product.ownerId
      ?? product.ownerID
      ?? product.shopId
      ?? product.shopID
      ?? product.storeId
      ?? product.storeID
      ?? null
    );

    const key = artisanId
      || (fallbackOwner != null ? `owner-${fallbackOwner}` : `name-${shopName.toLowerCase()}`);

    return {
      key,
      artisanId,
      shopName,
      shopAvatar,
      shopHref: artisanId ? `/artisan-shop?artisanId=${artisanId}` : null,
    };
  }, [translate]);

  const groupedShops = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const map = new Map();
    items.forEach((item) => {
      const info = resolveShopInfo(item);
      if (!map.has(info.key)) {
        map.set(info.key, { ...info, items: [] });
      }
      map.get(info.key).items.push(item);
    });

    return Array.from(map.values());
  }, [items, resolveShopInfo]);

  useEffect(() => {
    if (!groupedShops.length) {
      return;
    }

    if (!(pendingShopFetchRef.current instanceof Set)) {
      pendingShopFetchRef.current = new Set();
    }
    const pendingSet = pendingShopFetchRef.current;

    const groupsNeedingData = groupedShops.filter((group) => {
      if (!group?.artisanId) {
        return false;
      }
      if (pendingSet.has(group.key)) {
        return false;
      }
      if (shopDetails[group.key]) {
        return false;
      }
      return true;
    });

    if (!groupsNeedingData.length) {
      return;
    }

    let canceled = false;

    groupsNeedingData.forEach((group) => {
      try {
        pendingSet.add(group.key);
      } catch (error) {
        console.error('Không thể đánh dấu trạng thái tải shop:', error);
      }

      ShopService.getShopByUserId(group.artisanId)
        .then((response) => {
          if (canceled) {
            return;
          }
          const normalized = normalizeShopData(
            response?.shop || response?.data || response,
            {
              shopName: group.shopName,
              shopAvatar: group.shopAvatar,
              shopHref: group.shopHref,
            },
          ) || {
            shopName: group.shopName,
            shopAvatar: group.shopAvatar,
            shopHref: group.shopHref,
          };

          setShopDetails((prev) => {
            const existing = prev[group.key];
            if (existing
              && existing.shopName === normalized.shopName
              && existing.shopAvatar === normalized.shopAvatar
              && existing.shopHref === normalized.shopHref) {
              return prev;
            }
            return {
              ...prev,
              [group.key]: normalized,
            };
          });
        })
        .catch((error) => {
          console.error('Không thể tải thông tin cửa hàng:', error);
          if (canceled) {
            return;
          }
          setShopDetails((prev) => {
            if (prev[group.key]) {
              return prev;
            }
            return {
              ...prev,
              [group.key]: {
                shopName: group.shopName,
                shopAvatar: group.shopAvatar,
                shopHref: group.shopHref,
              },
            };
          });
        })
        .finally(() => {
          pendingSet.delete(group.key);
        });
    });

    return () => {
      canceled = true;
    };
  }, [groupedShops, shopDetails, normalizeShopData]);

  const selectedShopNames = useMemo(() => {
    if (!groupedShops.length) {
      return [];
    }

    const names = new Set();
    groupedShops.forEach((group) => {
      const hasSelected = group.items.some((groupItem) => {
        const key = getItemKey(groupItem);
        if (!key || isUnavailable(groupItem)) {
          return false;
        }
        return selectedItemIds.has(key);
      });
      if (hasSelected) {
        const hydrated = shopDetails[group.key];
        names.add(hydrated?.shopName || group.shopName);
      }
    });

    return Array.from(names);
  }, [groupedShops, selectedItemIds, getItemKey, shopDetails]);

  const summaryContext = useMemo(() => {
    if (selectedShopNames.length === 1) {
      return selectedShopNames[0];
    }
    if (selectedShopNames.length > 1) {
      return translate('cart.multipleShopsSelected', { count: selectedShopNames.length });
    }
    return null;
  }, [selectedShopNames, translate]);

  const confirmationItems = checkoutConfirm.items && checkoutConfirm.items.length
    ? checkoutConfirm.items
    : items;

  const confirmationSubtotal = confirmationItems.reduce((totalPrice, cartItem) => (
    isUnavailable(cartItem)
      ? totalPrice
      : totalPrice + (cartItem.price || 0) * (cartItem.quantity || 0)
  ), 0);

  const confirmationTotal = confirmationItems.length === items.length
    ? total
    : confirmationSubtotal;

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
          <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
            <label className="inline-flex items-center gap-2 text-sm text-[#8B4513] font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-5 h-5 accent-[#8B4513]"
                checked={allSelected}
                ref={(element) => {
                  if (element) {
                    element.indeterminate = partiallySelected;
                  }
                }}
                onChange={(event) => toggleAllSelection(event.target.checked)}
                disabled={!selectableItemIds.length}
              />
              <span>{translate('cart.selectAll', 'Chọn tất cả')}</span>
            </label>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <span className="inline-flex items-center gap-2 bg-[#FFF8EE] text-[#8B4513] px-4 py-2 rounded-full border border-[#D4A574]/50">
                {selectedItems.length
                  ? (
                    <>
                      🧮 {t('cart.selectedSummary', {
                        count: selectedQuantity,
                        amount: formatCurrency(selectedSubtotal, priceSuffix),
                      })}
                    </>
                  )
                  : (
                    <>
                      ℹ️ {translate('cart.emptySelection', 'Chọn sản phẩm để xem tổng tiền.')}
                    </>
                  )}
              </span>
              <span className="inline-flex items-center gap-2 bg-[#FFF1E5] text-[#8B4513] px-4 py-2 rounded-full border border-[#D4A574]/50">
                🧺 {t('cart.subtotal')}:{' '}
                <strong>{formatCurrency(subtotal, priceSuffix)}</strong>
              </span>
            </div>
          </div>
        )}
      </header>

      {loading ? (
        renderSkeleton()
      ) : items.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            {groupedShops.map((group) => {
              const hydratedShop = shopDetails[group.key] || {};
              const shopName = hydratedShop.shopName || group.shopName;
              const shopAvatar = hydratedShop.shopAvatar || group.shopAvatar;
              const shopHref = hydratedShop.shopHref !== undefined ? hydratedShop.shopHref : group.shopHref;
              const groupSubtotal = group.items.reduce((totalPrice, groupItem) => (
                isUnavailable(groupItem)
                  ? totalPrice
                  : totalPrice + (groupItem.price || 0) * (groupItem.quantity || 0)
              ), 0);
              const groupSelectableIds = group.items
                .filter((groupItem) => !isUnavailable(groupItem))
                .map((groupItem) => getItemKey(groupItem))
                .filter((key) => Boolean(key));
              const groupSelectedItems = group.items.filter((groupItem) => {
                const key = getItemKey(groupItem);
                if (!key || isUnavailable(groupItem)) {
                  return false;
                }
                return selectedItemIds.has(key);
              });
              const groupHasAvailable = groupSelectableIds.length > 0;
              const groupHasSelection = groupSelectedItems.length > 0;
              const groupAllSelected = groupSelectableIds.length > 0
                && groupSelectableIds.every((id) => selectedItemIds.has(id));
              const groupSomeSelected = groupSelectableIds.some((id) => selectedItemIds.has(id));

              return (
                <section
                  key={group.key}
                  className="border border-[#efe7db] rounded-2xl bg-white shadow-sm overflow-hidden"
                >
                  <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-[#f1e4d1] bg-[#fffaf3]">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-[#8B4513]"
                        checked={groupAllSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = !groupAllSelected && groupSomeSelected;
                          }
                        }}
                        onChange={(event) => handleShopSelectionChange(group.items, event.target.checked)}
                        disabled={!groupHasAvailable}
                        aria-label={translate('cart.shopSelectLabel', 'Chọn cửa hàng này')}
                      />
                      {shopAvatar ? (
                        <img
                          src={shopAvatar}
                          alt={shopName}
                          className="w-10 h-10 rounded-full object-cover border border-[#f1e4d1]"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = '/images/default-shop.png';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center font-semibold uppercase border border-[#f1e4d1]">
                          {(shopName || 'S').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        {shopHref ? (
                          <Link
                            to={shopHref}
                            className="text-base font-semibold text-[#8B4513] hover:text-[#B73E3E] transition"
                          >
                            {shopName}
                          </Link>
                        ) : (
                          <p className="text-base font-semibold text-[#8B4513]">{shopName}</p>
                        )}
                      </div>
                    </div>
                    {shopHref && (
                      <Link
                        to={shopHref}
                        className="inline-flex items-center text-sm font-medium text-[#8B4513] hover:text-[#B73E3E] transition"
                      >
                        {translate('cart.visitShop', 'Xem cửa hàng')}
                      </Link>
                    )}
                  </header>

                  <div className="px-4 py-4 space-y-5">
                    {group.items.map((item) => {
                      const isUpdating = updatingItemId === item.id || updatingItemId === item.cartItemId;
                      const subtotalPerItem = (item.price || 0) * (item.quantity || 0);
                      const itemUnavailable = isUnavailable(item);
                      const draftKey = item.cartItemId || item.id;
                      const draftValue = quantityDrafts[draftKey] ?? String(item.quantity ?? 1);
                      const itemKey = getItemKey(item);
                      const isItemSelected = itemKey ? selectedItemIds.has(itemKey) : false;
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
                      const summaryThreshold = 120;
                      const isSummaryLong = summaryText.length > summaryThreshold;
                      const isDescriptionExpanded = itemKey ? Boolean(expandedDescriptions[itemKey]) : false;
                      const truncatedSummary = isSummaryLong
                        ? `${summaryText.slice(0, summaryThreshold).trim()}…`
                        : summaryText;
                      const displaySummary = isDescriptionExpanded ? summaryText : truncatedSummary;
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
                          key={`${group.key}-${item.id}`}
                          className={`border rounded-2xl shadow-sm p-4 md:p-5 transition ${
                            itemUnavailable
                              ? 'bg-gray-100 border-gray-300 opacity-80'
                              : 'bg-white border-gray-200 hover:shadow-md'
                          }`}
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                            <div className="flex items-start md:pt-2">
                              <input
                                type="checkbox"
                                className="w-5 h-5 accent-[#8B4513] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                checked={isItemSelected}
                                onChange={(event) => toggleItemSelection(item, event.target.checked)}
                                disabled={itemUnavailable}
                                aria-label={translate('cart.itemSelectLabel', 'Chọn sản phẩm này')}
                              />
                            </div>

                            <div className="w-full md:w-32 md:flex-shrink-0">
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
                                  <span className="whitespace-nowrap">{formatCurrency(item.price, priceSuffix)}</span>
                                  {itemUnavailable && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                                      {soldOutText}
                                    </span>
                                  )}
                                </p>
                                {summaryText && (
                                  <div className={`mt-2 max-w-2xl text-sm ${itemUnavailable ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <div className="relative">
                                      <div
                                        className={isDescriptionExpanded ? '' : 'overflow-hidden'}
                                        style={isDescriptionExpanded ? undefined : {
                                          display: '-webkit-box',
                                          WebkitLineClamp: 3,
                                          WebkitBoxOrient: 'vertical',
                                        }}
                                      >
                                        {displaySummary}
                                      </div>
                                      {!isDescriptionExpanded && isSummaryLong && (
                                        <div
                                          className={`pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t ${itemUnavailable ? 'from-gray-100' : 'from-white'} to-transparent`}
                                          aria-hidden="true"
                                        />
                                      )}
                                    </div>
                                    {isSummaryLong && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!itemKey) {
                                            return;
                                          }
                                          setExpandedDescriptions((prev) => {
                                            const next = { ...(prev || {}) };
                                            if (next[itemKey]) {
                                              delete next[itemKey];
                                            } else {
                                              next[itemKey] = true;
                                            }
                                            return next;
                                          });
                                        }}
                                        className="mt-1 text-sm font-semibold text-[#8B4513] hover:text-[#B73E3E] transition-colors"
                                      >
                                        {isDescriptionExpanded
                                          ? translate('cart.showLess', 'Thu gọn')
                                          : translate('cart.showMore', 'Xem thêm')}
                                      </button>
                                    )}
                                  </div>
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
                                <div className="inline-flex items-center gap-1.5 bg-[#FFFBF0] rounded-full px-2 py-1.5 border border-[#D4A574]/50">
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
                                    className={`w-7 h-7 flex items-center justify-center rounded-full border border-transparent transition ${
                                      isUpdating || itemUnavailable
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-[#8B4513] hover:bg-white hover:border-[#D4A574]'
                                    }`}
                                    disabled={isUpdating || itemUnavailable}
                                  >
                                    <FaMinus size={11} />
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
                                    className={`w-12 text-center font-semibold text-[#8B4513] bg-transparent border border-transparent focus:border-[#D4A574] focus:bg-white focus:outline-none rounded-md py-1 ${
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
                                    className={`w-7 h-7 flex items-center justify-center rounded-full border border-transparent transition ${
                                      isUpdating || itemUnavailable
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-[#8B4513] hover:bg-white hover:border-[#D4A574]'
                                    }`}
                                    disabled={isUpdating || itemUnavailable}
                                  >
                                    <FaPlus size={11} />
                                  </button>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4 sm:justify-end">
                                  <div className="text-right">
                                    <p className="text-sm text-gray-500">{t('cart.headerSubtotal')}</p>
                                    <p className={`text-lg font-semibold whitespace-nowrap ${itemUnavailable ? 'text-gray-500' : 'text-[#8B4513]'}`}>
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

                  <footer className="px-5 py-4 border-t border-[#f1e4d1] bg-[#fffaf3] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-gray-600">
                      <p className="font-semibold text-[#8B4513]">{translate('cart.shopSubtotal', 'Tổng tiền đơn hàng')}</p>
                      <p>{formatCurrency(groupSubtotal, priceSuffix)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!groupHasSelection && groupHasAvailable) {
                          handleShopSelectionChange(group.items, true);
                        }
                        openCheckoutForItems(
                          groupHasSelection ? groupSelectedItems : group.items,
                          group.shopName,
                        );
                      }}
                      disabled={!groupHasAvailable}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-[#8B4513] text-white font-semibold hover:bg-[#D4A574] transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {groupHasAvailable
                        ? translate('cart.checkoutShop', 'Đặt hàng')
                        : translate('cart.checkoutShopDisabled', 'Tất cả sản phẩm đã hết hàng')}
                    </button>
                  </footer>
                </section>
              );
            })}
          </div>

          <aside className="bg-white border border-[#efe7db] rounded-2xl shadow-xl p-6 h-fit lg:sticky lg:top-6">
            <h2 className="text-xl font-semibold text-[#8B4513] mb-6">{t('cart.summaryTitle')}</h2>
            <div className="mb-4 bg-[#FFF8EE] border border-[#F3D5B5] rounded-xl px-4 py-3 text-sm text-[#8B4513] space-y-1">
              <p className="font-semibold">
                {selectionActive
                  ? t('cart.selectedSummary', {
                      count: summaryQuantity,
                      amount: formatCurrency(summarySubtotal, priceSuffix),
                    })
                  : translate('cart.emptySelection', 'Chọn sản phẩm để xem tổng tiền.')}
              </p>
              {selectionActive && selectedShopNames.length > 0 && (
                <p className="text-xs uppercase tracking-wide">
                  {translate('cart.checkoutContextLabel', 'Cửa hàng được chọn')}
                  {`: ${selectedShopNames.join(', ')}`}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>{translate('cart.selectedCountLabel', 'Sản phẩm đã chọn')}</span>
                <span className="font-semibold text-[#8B4513]">{summaryQuantity}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{translate('cart.selectedAmountLabel', 'Tạm tính')}</span>
                <span className="font-semibold text-[#8B4513]">
                  {formatCurrency(summarySubtotal, priceSuffix)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-semibold text-[#8B4513]">
                <span>{t('cart.total')}</span>
                <span>{formatCurrency(summaryTotal, priceSuffix)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!selectionActive) {
                  return;
                }
                openCheckoutForItems(selectedItems, summaryContext);
              }}
              disabled={!selectionActive}
              className="mt-6 w-full bg-[#8B4513] text-white rounded-lg py-3 font-semibold hover:bg-[#D4A574] transition disabled:opacity-60 disabled:cursor-not-allowed"
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
            {checkoutConfirm.context && (
              <div className="px-3 py-2 bg-[#FFF8EE] border border-[#F3D5B5] rounded-lg text-sm text-[#8B4513]">
                {translate('cart.checkoutContextLabel', 'Cửa hàng được chọn')}: {checkoutConfirm.context}
              </div>
            )}
            <div className="bg-[#FFF8EE] border border-[#F3D5B5] rounded-xl p-4 space-y-3 text-sm text-gray-600">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-[#8B4513]/70 mb-1">
                  {translate('cart.checkoutConfirmProducts', 'Sản phẩm trong đơn hàng')}
                </span>
                <ul className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {confirmationItems.map((item) => (
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
                <strong className="text-[#8B4513]">{formatCurrency(confirmationSubtotal, priceSuffix)}</strong>
              </div>
              <div className="flex justify-between text-base font-semibold text-[#8B4513]">
                <span>{t('cart.total')}</span>
                <span>{formatCurrency(confirmationTotal, priceSuffix)}</span>
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
                onClick={() => setCheckoutConfirm({ open: false, loading: false, items: [], context: null })}
                disabled={checkoutConfirm.loading}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition disabled:opacity-60"
              >
                {removeConfirmCancelText}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (checkoutConfirm.loading) return;
                  setCheckoutConfirm((prev) => ({ ...prev, loading: true }));
                  try {
                    const selected = checkoutConfirm.items && checkoutConfirm.items.length
                      ? checkoutConfirm.items
                      : undefined;
                    await onCheckout(selected);
                    setCheckoutConfirm({ open: false, loading: false, items: [], context: null });
                  } catch (error) {
                    console.error('Checkout error:', error);
                    setCheckoutConfirm({ open: false, loading: false, items: [], context: null });
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
