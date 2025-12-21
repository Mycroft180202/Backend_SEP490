import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';
import { resolveProductArtisanId } from '../../utils/productOwnership';
import { ShopService } from '../../services/modules/shop/shopService';

const shopProfileCache = new Map();
const pendingShopFetches = new Set();

const buildArtisanHref = (artisanId) => {
  if (artisanId === null || artisanId === undefined) {
    return null;
  }
  return `/artisan-shop?artisanId=${encodeURIComponent(artisanId)}`;
};

const pickFirstNonEmpty = (values = []) => {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    } else if (typeof value === 'object') {
      if (value.url) {
        return value.url;
      }
      if (value.href) {
        return value.href;
      }
    } else if (value) {
      return value;
    }
  }
  return null;
};

const normalizeShopData = (raw, fallback = {}) => {
  if (!raw || typeof raw !== 'object') {
    const fallbackId = fallback.artisanId || null;
    return {
      shopName: fallback.shopName || 'Cua hang',
      shopAvatar: fallback.shopAvatar || null,
      artisanId: fallbackId,
      shopHref: fallback.shopHref || (fallbackId ? buildArtisanHref(fallbackId) : null),
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

  const shopHref = pickFirstNonEmpty([
    raw.shopUrl,
    raw.shopURL,
    raw.url,
    raw.href,
    fallback.shopHref,
  ]);

  const normalizedId = artisanId !== null && artisanId !== undefined
    ? String(artisanId)
    : (fallback.artisanId || null);

  return {
    shopName: shopName || fallback.shopName || 'Cua hang',
    shopAvatar: shopAvatar || fallback.shopAvatar || null,
    artisanId: normalizedId,
    shopHref: shopHref || (normalizedId ? buildArtisanHref(normalizedId) : fallback.shopHref || null),
  };
};

const formatCurrency = (value, suffix = 'đ', locale = 'vi-VN') => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `0${suffix}`;
  }
  return `${numeric.toLocaleString(locale)}${suffix}`;
};

const deriveShopInfo = (item, translate) => {
  const product = item?.product || {};
  const artisanIdRaw = resolveProductArtisanId(product)
    ?? item?.artisanId
    ?? item?.shopId
    ?? item?.sellerId
    ?? item?.ownerId;
  const artisanId = artisanIdRaw !== null && artisanIdRaw !== undefined
    ? String(artisanIdRaw)
    : null;

  const productShop = product.shop || product.store || product.artisan || {};
  const itemShop = item.shop || item.store || item.artisan || {};

  const fallbackName = pickFirstNonEmpty([
    product.shopName,
    product.artisanName,
    product.ownerName,
    productShop.shopName,
    productShop.displayName,
    productShop.name,
    item.shopName,
    item.sellerName,
    item.vendorName,
    itemShop.shopName,
    itemShop.displayName,
    itemShop.name,
  ]) || translate('cart.shopFallback', 'Cua hang');

  const fallbackAvatar = pickFirstNonEmpty([
    product.shopImage,
    product.shopAvatar,
    product.ownerAvatar,
    product.artisanAvatar,
    productShop.shopUrlImage,
    productShop.shopURLImage,
    productShop.shopImage,
    productShop.logoUrl,
    productShop.logoURL,
    productShop.avatarUrl,
    productShop.avatarURL,
    productShop.imageUrl,
    item.shopAvatar,
    item.shopImage,
    item.sellerAvatar,
    itemShop.shopUrlImage,
    itemShop.avatarUrl,
    itemShop.imageUrl,
  ]);

  const fallbackOwner = pickFirstNonEmpty([
    productShop.userId,
    productShop.userID,
    productShop.ownerId,
    productShop.ownerID,
    itemShop.userId,
    itemShop.userID,
    itemShop.ownerId,
    itemShop.ownerID,
    item.shopId,
    item.shopID,
    item.ownerId,
    item.ownerID,
    item.sellerId,
    item.sellerID,
  ]);

  const nameKey = fallbackName ? fallbackName.trim().toLowerCase().replace(/\s+/g, '-') : 'shop';

  const key = artisanId
    ? `artisan-${artisanId}`
    : fallbackOwner
      ? `owner-${String(fallbackOwner)}`
      : `name-${nameKey}`;

  return {
    key,
    artisanId,
    shopName: fallbackName,
    shopAvatar: fallbackAvatar || null,
    shopHref: artisanId ? buildArtisanHref(artisanId) : null,
    fallbackOwner: fallbackOwner !== null && fallbackOwner !== undefined
      ? String(fallbackOwner)
      : null,
  };
};

const ProductReview = ({
  items = [],
  loading = false,
  currencySuffix = 'đ',
}) => {
  const { t, language } = useContext(LanguageContext);

  const translate = useCallback((key, fallback) => {
    if (typeof t !== 'function') {
      return fallback;
    }
    const result = t(key);
    if (result === null || result === undefined || result === key) {
      return fallback;
    }
    if (typeof result === 'string' && result.trim().length === 0) {
      return fallback;
    }
    return result;
  }, [t]);

  const locale = useMemo(
    () => (language === 'vi' ? 'vi-VN' : 'en-US'),
    [language],
  );

  const groupedItems = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const groups = new Map();

    items.forEach((item) => {
      if (!item) {
        return;
      }

      const shopInfo = deriveShopInfo(item, translate);
      const existing = groups.get(shopInfo.key);

      if (existing) {
        existing.shopName = pickFirstNonEmpty([existing.shopName, shopInfo.shopName]) || existing.shopName;
        existing.shopAvatar = pickFirstNonEmpty([existing.shopAvatar, shopInfo.shopAvatar]) || existing.shopAvatar;
        existing.shopHref = pickFirstNonEmpty([existing.shopHref, shopInfo.shopHref]) || existing.shopHref;
        if (!existing.artisanId && shopInfo.artisanId) {
          existing.artisanId = shopInfo.artisanId;
        }
        existing.items.push(item);
      } else {
        groups.set(shopInfo.key, {
          key: shopInfo.key,
          artisanId: shopInfo.artisanId,
          fallbackOwner: shopInfo.fallbackOwner,
          shopName: shopInfo.shopName,
          shopAvatar: shopInfo.shopAvatar,
          shopHref: shopInfo.shopHref,
          items: [item],
        });
      }
    });

    return Array.from(groups.values());
  }, [items, translate]);

  const [shopDetails, setShopDetails] = useState({});

  useEffect(() => {
    if (!groupedItems.length) {
      setShopDetails({});
      return;
    }

    let canceled = false;

    groupedItems.forEach((group) => {
      const {
        key,
        artisanId,
        shopName,
        shopAvatar,
        shopHref,
      } = group;

      if (!artisanId) {
        setShopDetails((prev) => {
          if (prev[key]) {
            return prev;
          }
          return {
            ...prev,
            [key]: {
              shopName,
              shopAvatar,
              shopHref,
              artisanId: null,
              loading: false,
            },
          };
        });
        return;
      }

      if (shopProfileCache.has(artisanId)) {
        const cached = shopProfileCache.get(artisanId);
        setShopDetails((prev) => ({
          ...prev,
          [key]: {
            shopName: cached.shopName || shopName,
            shopAvatar: cached.shopAvatar || shopAvatar,
            shopHref: cached.shopHref || shopHref || buildArtisanHref(cached.artisanId || artisanId),
            artisanId: cached.artisanId || artisanId,
            loading: false,
          },
        }));
        return;
      }

      if (pendingShopFetches.has(artisanId)) {
        setShopDetails((prev) => ({
          ...prev,
          [key]: {
            shopName: prev[key]?.shopName || shopName,
            shopAvatar: prev[key]?.shopAvatar || shopAvatar,
            shopHref: prev[key]?.shopHref || shopHref,
            artisanId,
            loading: true,
          },
        }));
        return;
      }

      pendingShopFetches.add(artisanId);

      setShopDetails((prev) => ({
        ...prev,
        [key]: {
          shopName: prev[key]?.shopName || shopName,
          shopAvatar: prev[key]?.shopAvatar || shopAvatar,
          shopHref: prev[key]?.shopHref || shopHref,
          artisanId,
          loading: true,
        },
      }));

      ShopService.getShopByUserId(artisanId)
        .then((response) => {
          if (canceled) {
            return;
          }

          const normalized = normalizeShopData(
            response?.shop || response?.data || response,
            {
              shopName,
              shopAvatar,
              artisanId,
              shopHref,
            },
          );

          shopProfileCache.set(artisanId, normalized);

          setShopDetails((prev) => ({
            ...prev,
            [key]: {
              shopName: normalized.shopName,
              shopAvatar: normalized.shopAvatar,
              shopHref: normalized.shopHref || shopHref,
              artisanId: normalized.artisanId || artisanId,
              loading: false,
            },
          }));
        })
        .catch((error) => {
          console.error(`Failed to load shop ${artisanId}:`, error);
          if (canceled) {
            return;
          }
          setShopDetails((prev) => ({
            ...prev,
            [key]: {
              shopName,
              shopAvatar,
              shopHref,
              artisanId,
              loading: false,
            },
          }));
        })
        .finally(() => {
          pendingShopFetches.delete(artisanId);
        });
    });

    return () => {
      canceled = true;
    };
  }, [groupedItems]);

  const renderSkeleton = () => (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={`checkout-skeleton-${idx}`}
          className="grid grid-cols-12 gap-4 items-center animate-pulse"
        >
          <div className="col-span-6 flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-gray-200" />
            <div className="space-y-2 w-full">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          <div className="col-span-2 h-4 bg-gray-200 rounded mx-auto w-14" />
          <div className="col-span-2 h-4 bg-gray-200 rounded mx-auto w-12" />
          <div className="col-span-2 h-4 bg-gray-200 rounded ms-auto w-16" />
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <section className="border border-gray-200 rounded-2xl bg-white shadow-sm px-6 py-6">
        {renderSkeleton()}
      </section>
    );
  }

  if (!groupedItems.length) {
    return (
      <section className="border border-gray-200 rounded-2xl bg-white shadow-sm px-6 py-6">
        <p className="text-center text-sm text-gray-500 font-nunito">
          {translate('checkout.review.empty', 'Khong co san pham de hien thi.')}
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groupedItems.map((group) => {
        const hydration = shopDetails[group.key] || {};
        const fallbackName = translate('cart.shopFallback', 'Cua hang');
        const displayName = pickFirstNonEmpty([
          hydration.shopName,
          group.shopName,
          fallbackName,
        ]) || fallbackName;
        const displayAvatar = pickFirstNonEmpty([
          hydration.shopAvatar,
          group.shopAvatar,
        ]);
        const displayHref = pickFirstNonEmpty([
          hydration.shopHref,
          group.shopHref,
          hydration.artisanId ? buildArtisanHref(hydration.artisanId) : null,
          group.artisanId ? buildArtisanHref(group.artisanId) : null,
        ]);
        const isHydrating = Boolean(hydration.loading);
        const placeholderInitial = displayName.charAt(0).toUpperCase() || 'S';

        return (
          <section
            key={group.key}
            className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm"
          >
            <header className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className={`w-10 h-10 rounded-full object-cover border border-gray-200 ${isHydrating ? 'opacity-80' : ''}`}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = '/images/default-shop.png';
                    }}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold uppercase border border-primary/20 ${isHydrating ? 'animate-pulse' : ''}`}>
                    {placeholderInitial}
                  </div>
                )}
                <div className="flex flex-col">
                  <p className="font-nunito text-base font-semibold text-black">
                    {displayName}
                  </p>
                  {isHydrating && (
                    <span className="text-xs text-gray-500 font-nunito">
                      {translate('cart.loadingShop', 'Dang tai thong tin cua hang...')}
                    </span>
                  )}
                </div>
              </div>
              {displayHref && (
                <Link
                  to={displayHref}
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition"
                >
                  {translate('cart.visitShop', 'Xem cua hang')}
                </Link>
              )}
            </header>

            <div className="divide-y divide-gray-100">
              {group.items.map((item, index) => {
                const itemKey = item.cartItemId
                  ?? item.id
                  ?? item.productId
                  ?? `${group.key}-${index}`;
                const itemPrice = Number(item.price) || 0;
                const itemQuantity = Number(item.quantity) || 0;
                const subtotal = itemPrice * itemQuantity;
                const productCode = pickFirstNonEmpty([
                  item.product?.sku,
                  item.product?.code,
                  item.product?.productCode,
                  item.productId,
                  item.id,
                ]);
                const productImage = pickFirstNonEmpty([
                  item.imageUrl,
                  item.image,
                  item.product?.imageUrl,
                  item.product?.image,
                  item.product?.thumbnail,
                ]) || '/images/default-product.png';

                return (
                  <div
                    key={itemKey}
                    className="grid grid-cols-12 gap-4 items-center px-4 py-4"
                  >
                    <div className="col-span-6 flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={productImage}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = '/images/default-product.png';
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="font-nunito text-base font-semibold text-black">
                          {item.name}
                        </h3>
                        {productCode && (
                          <p className="font-nunito text-xs text-gray-500">
                            {`${translate('checkout.review.productCode', 'Ma san pham')}: ${productCode}`}
                          </p>
                        )}
                        {item.product?.artisanName && (
                          <p className="font-nunito text-xs text-gray-500">
                            {`${translate('checkout.review.artisan', 'Nghe nhan')}: ${item.product.artisanName}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 text-center font-nunito text-base text-black">
                      {formatCurrency(itemPrice, currencySuffix, locale)}
                    </div>

                    <div className="col-span-2 text-center font-nunito text-base text-black">
                      x{itemQuantity}
                    </div>

                    <div className="col-span-2 text-right font-alata text-lg font-semibold text-primary">
                      {formatCurrency(subtotal, currencySuffix, locale)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

ProductReview.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      cartItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      image: PropTypes.string,
      imageUrl: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      product: PropTypes.object,
    }),
  ),
  loading: PropTypes.bool,
  currencySuffix: PropTypes.string,
};

export default ProductReview;
