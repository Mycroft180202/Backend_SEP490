import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import CheckoutBanner from '../components/checkOut/CheckoutBanner';
import ProductReview from '../components/checkOut/ProductReview';
import AddressSelector from '../components/checkOut/AddressSelector';
import AddressManageModal from '../components/checkOut/AddressManageModal';
import PaymentMethod from '../components/checkOut/PaymentMethod';
import OrderSummary from '../components/checkOut/OrderSummary';
import TermsConfirmModal from '../components/checkOut/TermsConfirmModal';
import { CartService } from '../services/modules/cart/cartService';
import { AuthService } from '../services/modules/auth/authService';
import { OrderService } from '../services/modules/orders/orderService';
import { GHNLocationService } from '../services/modules/shipping/ghnLocationService';
import { VoucherService } from '../services/modules/voucher/voucherService';
import { ShopService } from '../services/modules/shop/shopService';
import { LanguageContext } from '../context/LanguageContext';
import { NavigationKeys } from '../context/NavigationContext';
import useNavigationNode from '../hooks/useNavigationNode';
import { resolveProductArtisanId } from '../utils/productOwnership';

const STORAGE_SELECTED_CART_IDS = 'checkoutSelectedCartIds';
const STORAGE_TERMS_ACCEPTED = 'checkoutTermsAccepted';
const STORAGE_TERMS_PENDING = 'checkoutTermsPending';

const normalizeSelectionIds = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }
  const normalized = value
    .map((id) => {
      if (id === null || id === undefined) return null;
      const trimmed = String(id).trim();
      return trimmed.length ? trimmed : null;
    })
    .filter(Boolean);
  return Array.from(new Set(normalized));
};

const getItemSelectionKey = (item) => {
  if (!item) return null;
  return (
    item.cartItemId
    ?? item.id
    ?? item.productId
    ?? item.product?.id
    ?? item.product?.productId
    ?? null
  );
};

const resolveArtisanFromItem = (item) => {
  if (!item) return null;
  const fromProduct = resolveProductArtisanId(item.product);
  if (fromProduct) {
    return String(fromProduct);
  }
  const fallback =
    item.artisanId
    ?? item.shopId
    ?? item.ownerId
    ?? item.product?.shopId
    ?? item.product?.artisanId
    ?? null;
  return fallback !== null && fallback !== undefined ? String(fallback) : null;
};

const tryParseJson = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
    || (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return null;
    }
  }
  return null;
};

const normalizeErrorMessage = (input) => {
  if (!input) return null;
  if (typeof input === 'string') {
    const parsed = tryParseJson(input);
    if (parsed) {
      return normalizeErrorMessage(parsed.message ?? parsed.error ?? parsed.detail ?? parsed);
    }
    return input;
  }
  if (typeof input === 'object') {
    if (input.message) {
      const nested = normalizeErrorMessage(input.message);
      if (nested) {
        return nested;
      }
    }
    if (input.error) {
      const nested = normalizeErrorMessage(input.error);
      if (nested) {
        return nested;
      }
    }
    try {
      return JSON.stringify(input);
    } catch (error) {
      return null;
    }
  }
  return String(input);
};

const extractApiErrorMessage = (error, fallbackMessage = null) => {
  const rawMessage =
    error?.response?.data?.message
    ?? error?.response?.data?.title
    ?? error?.response?.message
    ?? error?.message;
  const normalized = normalizeErrorMessage(rawMessage);
  return normalized || fallbackMessage;
};

const isUnavailable = (item) => {
  if (!item) return false;
  const activeFlags = [
    item.isActive,
    item.product?.isActive,
    item.product?.product?.isActive,
  ].filter((flag) => flag !== undefined);
  const isInactive = activeFlags.length ? activeFlags.some((flag) => flag === false) : false;

  const stockValues = [
    item.stock,
    item.product?.stock,
    item.product?.product?.stock,
  ].filter((value) => value !== undefined);
  const stock = stockValues.length ? Number(stockValues[0]) : undefined;

  return isInactive || (Number.isFinite(stock) && stock <= 0);
};

const CheckOut = () => {
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    shipping: 0,
    total: 0,
  });
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [voucherData, setVoucherData] = useState({ shared: [], personal: [] });
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState('');
  const [selectedCartIds, setSelectedCartIds] = useState([]);
  const [shopInfoByArtisan, setShopInfoByArtisan] = useState({});
  const shippingFeeRef = useRef(0);
  const redirectTimeoutRef = useRef(null);
  const pendingShopFetchRef = useRef(new Set());
  const removedUnavailableToastShownRef = useRef(false);
  const selectedAddressRef = useRef(null);

  const token = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null),
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const accepted = sessionStorage.getItem(STORAGE_TERMS_ACCEPTED) === '1';
      setTermsAccepted(accepted);
      const pending = sessionStorage.getItem(STORAGE_TERMS_PENDING) === '1';
      if (pending) {
        sessionStorage.removeItem(STORAGE_TERMS_PENDING);
        setTermsModalOpen(true);
      }
    } catch (error) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_TERMS_ACCEPTED, termsAccepted ? '1' : '0');
    } catch (error) {
      // ignore
    }
  }, [termsAccepted]);

  useEffect(() => {
    selectedAddressRef.current = selectedAddress;
  }, [selectedAddress]);

  const priceSuffix = t('productCard.priceSuffix') || '₫';

  const checkoutNavigationNode = useMemo(() => {
    const label = t('checkout.title');
    return {
      label: label && label !== 'checkout.title' ? label : 'Thanh toán',
      href: '/checkout',
    };
  }, [t]);

  useNavigationNode(NavigationKeys.LAST_PROFILE_ENTRY, checkoutNavigationNode);

  useEffect(() => {
    const syncSelection = () => {
      const stateIds = normalizeSelectionIds(location.state?.selectedCartIds || []);
      if (stateIds.length) {
        setSelectedCartIds(stateIds);
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(STORAGE_SELECTED_CART_IDS, JSON.stringify(stateIds));
          } catch (error) {
            console.warn('Unable to persist checkout selection:', error);
          }
        }
        return;
      }

      if (typeof window !== 'undefined') {
        try {
          const storedValue = sessionStorage.getItem(STORAGE_SELECTED_CART_IDS);
          if (storedValue) {
            const parsed = JSON.parse(storedValue);
            const normalized = normalizeSelectionIds(parsed);
            setSelectedCartIds(normalized);
            return;
          }
        } catch (error) {
          console.warn('Unable to restore checkout selection:', error);
        }
      }

      setSelectedCartIds([]);
    };

    syncSelection();
  }, [location.state]);

  const clearSelectionCache = useCallback(() => {
    setSelectedCartIds([]);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_SELECTED_CART_IDS);
      } catch (error) {
        console.warn('Unable to clear checkout selection:', error);
      }
    }
  }, []);

  const calculateShipping = useCallback(async (address, weight) => {
    if (!address || !address.ghnDistrictId || !address.ghnWardCode) {
      setShippingFee(0);
      return 0;
    }
    // avoid duplicate requests for same target + weight
    if (!calculateShipping.lastRequest) calculateShipping.lastRequest = { key: null };
    const key = `${address.ghnDistrictId}::${address.ghnWardCode}::${Math.round(weight || 500)}`;
    if (calculateShipping.lastRequest.key === key) {
      return calculateShipping.lastRequest.fee || 0;
    }
    try {
      setShippingLoading(true);
      const fee = await GHNLocationService.getShippingFee({
        toDistrictId: Number(address.ghnDistrictId),
        toWardCode: address.ghnWardCode,
        weight: weight > 0 ? Math.round(weight) : 500,
      });
      setShippingFee(fee);
      calculateShipping.lastRequest.key = key;
      calculateShipping.lastRequest.fee = fee;
      setShippingLoading(false);
      return fee;
    } catch (err) {
      console.error('Calculate shipping error:', err);
      setShippingFee(0);
      setShippingLoading(false);
      return 0;
    }
  }, []);

  // keep a ref of latest shippingFee to avoid recreating callbacks that depend on it
  useEffect(() => { shippingFeeRef.current = shippingFee; }, [shippingFee]);

  const resolveAddressNames = useCallback(async (addresses) => {
    if (!Array.isArray(addresses) || addresses.length === 0) return [];
    const provinces = await GHNLocationService.getProvinces();
    const getProvinceName = (provinceId) => {
      if (!provinceId) return '';
      const matched = provinces.find((p) => Number(p.ProvinceID) === Number(provinceId));
      return matched?.ProvinceName || '';
    };

    const districtCache = new Map();
    const wardCache = new Map();

    const resolved = await Promise.all(
      addresses.map(async (addr) => {
        const provinceId = addr.ghnProvinceId ?? addr.provinceId ?? addr.ProvinceID;
        let province = addr.province || getProvinceName(provinceId);

        const districtId = addr.ghnDistrictId ?? addr.districtId ?? addr.DistrictID;
        let district = addr.district;
        if (districtId) {
          const provinceKey = provinceId || 0;
          if (!districtCache.has(provinceKey)) {
            const districtsData = await GHNLocationService.getDistricts(provinceKey);
            districtCache.set(provinceKey, districtsData || []);
          }
          const districtsData = districtCache.get(provinceKey) || [];
          const matchedDistrict = districtsData.find(
            (d) => Number(d.DistrictID) === Number(districtId),
          );
          if (matchedDistrict) {
            district = matchedDistrict.DistrictName;
          }
        }

        const wardCode = addr.ghnWardCode ?? addr.wardCode ?? addr.WardCode;
        let ward = addr.ward;
        if (wardCode && districtId) {
          if (!wardCache.has(districtId)) {
            const wardsData = await GHNLocationService.getWards(districtId);
            wardCache.set(districtId, wardsData || []);
          }
          const wardsData = wardCache.get(districtId) || [];
          const matchedWard = wardsData.find(
            (w) => String(w.WardCode) === String(wardCode),
          );
          if (matchedWard) {
            ward = matchedWard.WardName;
          }
        }

        const combinedFull = [
          addr.detailAddress || addr.addressLine || addr.line1,
          ward,
          district,
          province,
        ]
          .filter(Boolean)
          .join(', ');

        return {
          ...addr,
          province,
          district,
          ward,
          line1: addr.line1 || combinedFull || addr.detailAddress || '',
          fullAddress: addr.fullAddress || combinedFull || addr.detailAddress || '',
        };
      }),
    );

    return resolved;
  }, []);

  const filterCartItemsBySelection = useCallback((items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const normalizedSelection = normalizeSelectionIds(selectedCartIds);
    if (!normalizedSelection.length) {
      return items;
    }

    const selectionSet = new Set(normalizedSelection);
    const filtered = items.filter((item) => {
      const key = getItemSelectionKey(item);
      return key && selectionSet.has(String(key));
    });

    if (filtered.length === 0 && items.length > 0) {
      toast.info(
        t('checkout.selectionMismatch')
        || 'Không tìm thấy các sản phẩm đã chọn. Hiển thị toàn bộ giỏ hàng.',
      );
      clearSelectionCache();
      return items;
    }

    return filtered;
  }, [selectedCartIds, t, clearSelectionCache]);

  const groupCartItemsByArtisan = useCallback((items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const fallbackName = t('cart.shopFallback') || 'Cửa hàng';
    const groups = new Map();

    items.forEach((item) => {
      if (!item) {
        return;
      }
      const artisanId = resolveArtisanFromItem(item);
      const groupKey = artisanId ?? 'UNKNOWN';

      if (!groups.has(groupKey)) {
        const shopNameCandidates = [
          item.product?.shopName,
          item.product?.artisanName,
          item.product?.ownerName,
          item.shopName,
          item.sellerName,
          item.vendorName,
        ];
        const resolvedName = shopNameCandidates.find(
          (value) => typeof value === 'string' && value.trim().length > 0,
        );
        groups.set(groupKey, {
          artisanId: artisanId ?? null,
          shopName: resolvedName || fallbackName,
          items: [],
        });
      }

      groups.get(groupKey)?.items.push(item);
    });

    return Array.from(groups.values());
  }, [t]);

  useEffect(() => {
    const groups = groupCartItemsByArtisan(cartItems);
    if (!groups.length) {
      return;
    }

    let canceled = false;

    groups.forEach((group) => {
      const artisanId = group.artisanId;
      if (!artisanId) {
        return;
      }
      if (shopInfoByArtisan[artisanId]) {
        return;
      }
      if (pendingShopFetchRef.current.has(artisanId)) {
        return;
      }

      pendingShopFetchRef.current.add(artisanId);

      ShopService.getShopByUserId(artisanId)
        .then((response) => {
          if (canceled) {
            return;
          }
          const payload = response?.shop || response?.data || response;
          const derivedName =
            payload?.shopName
            || payload?.name
            || payload?.displayName
            || payload?.title
            || group.shopName
            || `${t('cart.shopFallback') || 'Cửa hàng'} #${artisanId.slice(-4)}`;
          setShopInfoByArtisan((prev) => ({
            ...prev,
            [artisanId]: {
              shopName: derivedName,
            },
          }));
        })
        .catch((error) => {
          console.error('Unable to load shop info:', error);
          if (canceled) {
            return;
          }
          setShopInfoByArtisan((prev) => ({
            ...prev,
            [artisanId]: {
              shopName: group.shopName
                || `${t('cart.shopFallback') || 'Cửa hàng'} #${artisanId.slice(-4)}`,
            },
          }));
        })
        .finally(() => {
          pendingShopFetchRef.current.delete(artisanId);
        });
    });

    return () => {
      canceled = true;
    };
  }, [cartItems, groupCartItemsByArtisan, shopInfoByArtisan, t]);

  const getGroupDisplayName = useCallback((group) => {
    if (!group) {
      return t('cart.shopFallback') || 'Cửa hàng';
    }
    const info = group.artisanId ? shopInfoByArtisan[group.artisanId] : null;
    const fallbackLabel = t('cart.shopFallback') || 'Cửa hàng';
    const suffix = group.artisanId ? ` #${group.artisanId.slice(-4)}` : '';
    return (
      info?.shopName
      || group.shopName
      || (group.artisanId ? `${fallbackLabel}${suffix}` : fallbackLabel)
    );
  }, [shopInfoByArtisan, t]);

  const groupedCartItems = useMemo(
    () => groupCartItemsByArtisan(cartItems),
    [cartItems, groupCartItemsByArtisan],
  );

  const hasMultipleShops = groupedCartItems.length > 1;

  const vnpayMultiShopMessage = useMemo(() => {
    const translated = t('checkout.vnpayMultiShopMessage', {
      count: groupedCartItems.length,
    });
    if (translated && translated !== 'checkout.vnpayMultiShopMessage') {
      return translated;
    }
    if (groupedCartItems.length > 1) {
      return 'VNPay checkout is unavailable when the order contains products from multiple shops. Please choose another payment method.';
    }
    return '';
  }, [groupedCartItems.length, t]);


  const fetchCart = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingCart(true);
      const response = await CartService.getCart();
      const fetchedItems = response?.items || [];
      const availableItems = fetchedItems.filter((item) => !isUnavailable(item));
      if (availableItems.length !== fetchedItems.length) {
        if (!removedUnavailableToastShownRef.current) {
          toast.info('Một số sản phẩm đã hết hàng và được loại khỏi đơn thanh toán.');
          removedUnavailableToastShownRef.current = true;
        }
      } else {
        removedUnavailableToastShownRef.current = false;
      }
      const scopedItems = filterCartItemsBySelection(availableItems);
      setCartItems(scopedItems);

      if (!scopedItems.length) {
        setShippingFee(0);
      }

      const subtotal = scopedItems.reduce(
        (total, item) => total + (Number(item.price) || 0) * (item.quantity || 0),
        0,
      );
      // Prefer client-calculated shippingFee (from GHN) to avoid flicker/overwrite
      const serverShipping = response?.shipping ?? 0;
      const currentShippingFee = shippingFeeRef.current;
      const shipping = (currentShippingFee && Number.isFinite(currentShippingFee) && currentShippingFee > 0)
        ? currentShippingFee
        : serverShipping || 0;

      setCartSummary((prev) => {
        const hasItems = scopedItems.length > 0;
        const preservedShipping = hasItems
          ? (prev?.shipping && Number.isFinite(prev.shipping) && prev.shipping > 0
            ? prev.shipping
            : shipping)
          : 0;
        const computedTotal = hasItems ? subtotal + (preservedShipping || 0) : 0;
        return {
          ...prev,
          subtotal,
          shipping: preservedShipping,
          total: computedTotal,
        };
      });
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message
        || error?.response?.data?.title
        || error?.message
        || t('messages.cartLoadError');
      toast.error(message);
      setCartItems([]);
      setCartSummary({ subtotal: 0, shipping: 0, total: 0 });
    } finally {
      setLoadingCart(false);
    }
  }, [filterCartItemsBySelection, t, token]);

  const getAddressId = useCallback((address) => (
    address?.id
    ?? address?.addressId
    ?? address?.shippingAddressId
    ?? address?.code
    ?? null
  ), []);

  const fetchAddresses = useCallback(async (options = {}) => {
    if (!token) return;
    try {
      setLoadingAddresses(true);
      const profile = await AuthService.getUserInfo();

      const sourceAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];

      const prepared = sourceAddresses.map((address) => ({
        ...address,
        name: address.name
          || address.contactName
          || profile?.displayName
          || profile?.fullName
          || '',
        phone: address.phone
          || address.contactPhone
          || profile?.phoneNumber
          || '',
      }));

      const resolved = await resolveAddressNames(prepared);

      setAddresses(resolved);
      const preferId = options?.preferAddressId ? String(options.preferAddressId) : null;
      const currentSelected = selectedAddressRef.current;
      const currentSelectedId = currentSelected
        ? String(getAddressId(currentSelected) ?? currentSelected.__internalId ?? '')
        : '';

      const preferred = preferId
        ? resolved.find((addr) => String(getAddressId(addr) ?? addr.__internalId ?? '') === preferId)
        : null;
      const preserved = !preferred && currentSelectedId
        ? resolved.find((addr) => String(getAddressId(addr) ?? addr.__internalId ?? '') === currentSelectedId)
        : null;
      const fallback = resolved.find((addr) => addr.isDefault) || resolved[0] || null;

      const nextSelected = preferred || preserved || fallback;
      const nextSelectedId = nextSelected
        ? String(getAddressId(nextSelected) ?? nextSelected.__internalId ?? '')
        : '';

      setSelectedAddress((prev) => {
        const prevId = prev ? String(getAddressId(prev) ?? prev.__internalId ?? '') : '';
        if (prevId && nextSelectedId && prevId === nextSelectedId && !preferId) {
          return prev;
        }
        return nextSelected;
      });
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message
        || error?.message
        || t('messages.addressRequired');
      toast.error(message);
      setAddresses([]);
      setSelectedAddress(null);
    } finally {
      setLoadingAddresses(false);
    }
  }, [getAddressId, resolveAddressNames, t, token]);

  const fetchVouchers = useCallback(async () => {
    if (!token) return;
    try {
      setVoucherLoading(true);
      const response = await VoucherService.getMine();
      const shared = Array.isArray(response?.shared) ? response.shared : [];
      const personal = Array.isArray(response?.personal) ? response.personal : [];
      setVoucherData({ shared, personal });
    } catch (error) {
      console.error('Fetch vouchers error:', error);
      const message =
        error?.response?.data?.message
        || error?.response?.data?.title
        || error?.message
        || 'Khong the tai danh sach voucher.';
      toast.error(message);
      setVoucherData({ shared: [], personal: [] });
    } finally {
      setVoucherLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setCartItems([]);
      setCartSummary({ subtotal: 0, shipping: 0, total: 0 });
      setVoucherData({ shared: [], personal: [] });
      setSelectedVoucherCode('');
      if (!redirectTimeoutRef.current) {
        toast.info(t('messages.loginRequired'));
        redirectTimeoutRef.current = setTimeout(() => {
          navigate('/login', { replace: true, state: { from: '/checkout' } });
        }, 1200);
      }
      return () => {
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
          redirectTimeoutRef.current = null;
        }
      };
    }

    fetchCart();
    fetchAddresses();
    fetchVouchers();

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [fetchAddresses, fetchCart, fetchVouchers, navigate, t, token]);

  const allVouchers = useMemo(
    () => [...(voucherData.personal || []), ...(voucherData.shared || [])],
    [voucherData.personal, voucherData.shared],
  );
  const cartSubtotal = cartSummary.subtotal;
  const cartShipping = cartSummary.shipping;

  useEffect(() => {
    if (!selectedVoucherCode) return;
    const matched = allVouchers.find((voucher) => voucher?.code === selectedVoucherCode);
    if (!matched) {
      setSelectedVoucherCode('');
      return;
    }
    const subtotalValue = Number(cartSubtotal) || 0;
    const minAmount = Number(matched.minOrderAmount) || 0;
    if (minAmount > 0 && subtotalValue < minAmount) {
      setSelectedVoucherCode('');
    }
  }, [selectedVoucherCode, allVouchers, cartSubtotal]);

  const appliedVoucher = useMemo(() => {
    if (!selectedVoucherCode) return null;
    return allVouchers.find((voucher) => voucher?.code === selectedVoucherCode) || null;
  }, [allVouchers, selectedVoucherCode]);

  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    const subtotalValue = Number(cartSubtotal) || 0;
    if (subtotalValue <= 0) return 0;
    const minAmount = Number(appliedVoucher.minOrderAmount) || 0;
    if (minAmount > 0 && subtotalValue < minAmount) {
      return 0;
    }

    const type = (appliedVoucher.discountType || '').toLowerCase();
    let computedDiscount = 0;

    if (type === 'percent') {
      const percent = Number(appliedVoucher.discountValue) || 0;
      computedDiscount = (percent / 100) * subtotalValue;
      const maxDiscountAmount = Number(appliedVoucher.maxDiscountAmount) || 0;
      if (maxDiscountAmount > 0) {
        computedDiscount = Math.min(computedDiscount, maxDiscountAmount);
      }
    } else {
      computedDiscount = Number(appliedVoucher.discountValue) || 0;
    }

    const maxAllowable = subtotalValue + (Number(cartShipping) || 0);
    if (computedDiscount > maxAllowable) {
      computedDiscount = maxAllowable;
    }

    return computedDiscount > 0 ? computedDiscount : 0;
  }, [appliedVoucher, cartShipping, cartSubtotal]);

  const totalWeight = useMemo(() => (
    cartItems.reduce((total, item) => {
      const weightPerItem = Number(item?.product?.weight ?? item?.weight ?? 0);
      if (Number.isNaN(weightPerItem) || weightPerItem <= 0) {
        return total;
      }
      return total + weightPerItem * (item.quantity || 0);
    }, 0)
  ), [cartItems]);

  // First-load: calculate immediately when both cart and addresses finish loading and address is selected
  useEffect(() => {
    let mounted = true;
    const doImmediateCalc = async () => {
      if (!selectedAddress || !cartItems.length) {
        setShippingFee(0);
        setCartSummary((s) => ({ ...s, shipping: 0, total: (s.subtotal || 0) + 0 }));
        return;
      }
      const fee = await calculateShipping(selectedAddress, totalWeight);
      if (!mounted) return;
      console.log('First-load shipping calculated:', fee);
      setCartSummary((s) => {
        const newTotal = (s.subtotal || 0) + (fee || 0);
        console.log('Updated cart summary - subtotal:', s.subtotal, 'shipping:', fee, 'total:', newTotal);
        return { ...s, shipping: fee, total: newTotal };
      });
    };

    if (!loadingCart && !loadingAddresses && selectedAddress) {
      doImmediateCalc();
    }
    return () => { mounted = false; };
  }, [loadingCart, loadingAddresses, selectedAddress, totalWeight, calculateShipping, cartItems.length]);

  // Recalculate shipping when selected address or cart weight changes (with debounce)
  useEffect(() => {
    let mounted = true;
    let timer = null;
    const scheduleCalc = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (!selectedAddress || !cartItems.length) {
          setShippingFee(0);
          setCartSummary((s) => ({ ...s, shipping: 0, total: (s.subtotal || 0) + 0 }));
          return;
        }
        const fee = await calculateShipping(selectedAddress, totalWeight);
        if (!mounted) return;
        console.log('Debounced shipping calculated:', fee);
        setCartSummary((s) => {
          const newTotal = (s.subtotal || 0) + (fee || 0);
          console.log('Updated cart summary - subtotal:', s.subtotal, 'shipping:', fee, 'total:', newTotal);
          return { ...s, shipping: fee, total: newTotal };
        });
      }, 200);
    };

    // Only debounce if we're already done loading (not the initial load)
    if (!loadingCart && !loadingAddresses) {
      scheduleCalc();
    }

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [selectedAddress, totalWeight, calculateShipping, loadingCart, loadingAddresses, cartItems.length]);

  const handlePlaceOrder = async () => {
    const validCartItems = cartItems.filter((item) => !isUnavailable(item));
    if (!validCartItems.length) {
      toast.info(t('messages.cartEmpty'));
      return;
    }
    if (!selectedAddress) {
      toast.error(t('messages.addressRequired'));
      return;
    }

    // Extract addressId from selected address
    const addressId = selectedAddress?.id
      || selectedAddress?.addressId
      || selectedAddress?.shippingAddressId;
    if (!addressId) {
      toast.error(t('messages.addressRequired'));
      return;
    }

    const paymentMethod = selectedPaymentMethod === 'vnpay' ? 'VNPAY' : 'COD';
    const vnpayBankCode = 'NCB';
    const cartGroups = groupCartItemsByArtisan(validCartItems);
    if (!cartGroups.length) {
      toast.error(t('messages.cartEmpty'));
      return;
    }
    const multipleGroups = cartGroups.length > 1;

    const ensureNumber = (value, fallback = 0) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : fallback;
    };

    const latestShippingFee = (() => {
      const current = shippingFeeRef.current;
      if (Number.isFinite(current) && current >= 0) {
        return current;
      }
      if (Number.isFinite(shippingFee) && shippingFee >= 0) {
        return shippingFee;
      }
      if (Number.isFinite(cartSummary.shipping) && cartSummary.shipping >= 0) {
        return cartSummary.shipping;
      }
      return 0;
    })();

    const discountValue = ensureNumber(voucherDiscount);

    setPlacingOrder(true);
    const orderResults = [];
    const failedGroups = [];

    const buildPayloadItems = (items) => items
      .map((item) => {
        const productId = item.productId
          || item.product?.id
          || item.product?.productId;
        const quantity = item.quantity || 1;
        if (!productId || quantity <= 0) return null;
        return {
          productId,
          quantity,
        };
      })
      .filter(Boolean);

    const computeSubtotal = (items) => items.reduce(
      (total, item) => total + (Number(item.price) || 0) * (item.quantity || 0),
      0,
    );

    const computeWeight = (items) => items.reduce((total, item) => {
      const weightPerItem = Number(item?.product?.weight ?? item?.weight ?? 0);
      if (!Number.isFinite(weightPerItem) || weightPerItem <= 0) {
        return total;
      }
      return total + weightPerItem * (item.quantity || 0);
    }, 0);

    for (const group of cartGroups) {
      const groupName = getGroupDisplayName(group);
      const groupItemsPayload = buildPayloadItems(group.items);
      if (!groupItemsPayload.length) {
        continue;
      }

      const groupSubtotal = computeSubtotal(group.items);
      const groupWeight = computeWeight(group.items);
      const shippingFeeForGroup = multipleGroups
        ? await calculateShipping(selectedAddress, groupWeight)
        : latestShippingFee;
      const groupDiscount = multipleGroups ? 0 : discountValue;
      const computedTotal = Math.max(groupSubtotal + shippingFeeForGroup - groupDiscount, 0);

      const clientSummary = {
        subtotal: groupSubtotal,
        shippingFee: shippingFeeForGroup,
        discount: groupDiscount,
        total: computedTotal,
      };

      const payload = {
        cartItems: groupItemsPayload,
        addressId,
        paymentMethod,
        shippingServiceId: 53321,
        paymentTypeId: 2,
        serviceTypeId: 2,
        bankCode: vnpayBankCode,
        requiredNote: 'KHONGCHOXEMHANG',
        subtotal: clientSummary.subtotal,
        shippingFee: clientSummary.shippingFee,
        discountAmount: clientSummary.discount,
        totalAmount: clientSummary.total,
      };

      if (!multipleGroups && selectedVoucherCode) {
        payload.voucherCodeId = selectedVoucherCode;
      }

      let response;
      try {
        response = await OrderService.createOrder(payload);
      } catch (error) {
        const message = extractApiErrorMessage(
          error,
          t('messages.orderError') || 'Có lỗi xảy ra khi tạo đơn hàng',
        );
        if (multipleGroups) {
          failedGroups.push({ shopName: groupName, message });
          toast.error(`[${groupName}] ${message}`);
          continue;
        }
        toast.error(message);
        setPlacingOrder(false);
        return;
      }

      if (response?.data?.success || response?.success) {
        const orderData = response.data || response;
        const enrichedOrderData = {
          ...orderData,
          clientSummary,
        };

        if (enrichedOrderData.subtotal === undefined) {
          enrichedOrderData.subtotal = clientSummary.subtotal;
        }
        if (
          enrichedOrderData.shippingFee === undefined
          && enrichedOrderData.shipingFee === undefined
          && enrichedOrderData.deliveryFee === undefined
          && enrichedOrderData.shippingCost === undefined
        ) {
          enrichedOrderData.shippingFee = clientSummary.shippingFee;
        }
        if (
          enrichedOrderData.discount === undefined
          && enrichedOrderData.discountAmount === undefined
          && enrichedOrderData.promotionAmount === undefined
        ) {
          enrichedOrderData.discount = clientSummary.discount;
        }
        if (
          enrichedOrderData.total === undefined
          && enrichedOrderData.totalAmount === undefined
        ) {
          enrichedOrderData.total = clientSummary.total;
        }

        if (multipleGroups) {
          orderResults.push({ order: enrichedOrderData, shopName: groupName });
          if (paymentMethod === 'VNPAY') {
            toast.success(
              `${t('checkout.shopOrderSuccessPrefix') || 'Đã tạo đơn cho'} ${groupName}`,
            );
          }
          continue;
        }

        if (enrichedOrderData.paymentMethod === 'COD') {
          toast.success(t('messages.orderSuccess') || 'Đơn hàng được tạo thành công');
          sessionStorage.setItem('lastOrderSuccess', JSON.stringify(enrichedOrderData));
          clearSelectionCache();
          navigate('/order-success', { state: { order: enrichedOrderData } });
          return;
        }
        if (
          enrichedOrderData.paymentMethod === 'VNPAY'
          && enrichedOrderData.paymentUrl
        ) {
          toast.info('Đang chuyển hướng đến VNPAY...');
          sessionStorage.setItem('vnpayOrderData', JSON.stringify(enrichedOrderData));
          clearSelectionCache();
          window.location.href = enrichedOrderData.paymentUrl;
          return;
        }

        toast.success(t('messages.orderSuccess') || 'Đơn hàng được tạo thành công');
        sessionStorage.setItem('lastOrderSuccess', JSON.stringify(enrichedOrderData));
        clearSelectionCache();
        navigate('/order-success', { state: { order: enrichedOrderData } });
        return;
      }

      const fallbackMessage = extractApiErrorMessage(
        response,
        t('messages.orderError') || 'Có lỗi xảy ra khi tạo đơn hàng',
      );
      if (multipleGroups) {
        failedGroups.push({ shopName: groupName, message: fallbackMessage });
        toast.error(`[${groupName}] ${fallbackMessage}`);
        continue;
      }
      toast.error(fallbackMessage);
      setPlacingOrder(false);
      return;
    }

    if (multipleGroups) {
      if (paymentMethod === 'VNPAY') {
        if (!orderResults.length) {
          setPlacingOrder(false);
          if (failedGroups.length) {
            const failedNames = failedGroups
              .map((group) => group.shopName)
              .filter(Boolean)
              .join(', ');
            const message = failedGroups[0]?.message
              || t('messages.orderError')
              || 'Có lỗi xảy ra khi tạo đơn hàng';
            toast.error(
              failedNames
                ? `[${failedNames}] ${message}`
                : message,
            );
          } else {
            toast.error(t('messages.orderError') || 'Có lỗi xảy ra khi tạo đơn hàng');
          }
          return;
        }

        if (orderResults.length && failedGroups.length) {
          const failedNames = failedGroups
            .map((group) => group.shopName)
            .filter(Boolean)
            .join(', ');
          toast.warn(
            t('checkout.partialShopSuccess', {
              success: orderResults.length,
              failed: failedGroups.length,
            })
            || `Đã tạo ${orderResults.length} đơn, nhưng ${failedGroups.length} cửa hàng gặp lỗi.`,
            failedNames ? { toastId: `partial-${failedNames}` } : undefined,
          );
          if (failedNames) {
            toast.error(`${t('checkout.failedShopsLabel') || 'Cửa hàng lỗi'}: ${failedNames}`);
          }
          setPlacingOrder(false);
          navigate('/order-history');
          return;
        }

        const successfulOrderNumbers = orderResults
          .map((entry) => entry.order?.orderNumber)
          .filter(Boolean);
        try {
          const batchResponse = await OrderService.createVnpayBatchPayment({
            orderNumbers: successfulOrderNumbers,
            bankCode: vnpayBankCode,
          });
          if (batchResponse?.paymentUrl) {
            toast.info('Đang chuyển hướng đến VNPAY...');
            sessionStorage.setItem('vnpayOrderData', JSON.stringify({
              success: true,
              multiShop: true,
              orders: orderResults.map(({ order, shopName }) => ({
                orderNumber: order?.orderNumber,
                shopName,
                total:
                  order?.clientSummary?.total
                  ?? order?.totalAmount
                  ?? order?.total,
              })),
            }));
            clearSelectionCache();
            window.location.href = batchResponse.paymentUrl;
            return;
          }
          toast.error('Không thể khởi tạo VNPay cho đơn nhiều shop.');
        } catch (error) {
          const message = extractApiErrorMessage(
            error,
            t('messages.orderError') || 'Không thể khởi tạo thanh toán VNPay cho đơn này',
          );
          toast.error(message);
        } finally {
          setPlacingOrder(false);
        }
        return;
      }

      setPlacingOrder(false);
      if (orderResults.length && failedGroups.length === 0) {
        clearSelectionCache();
        toast.success(
          t('checkout.multiShopSuccess', { count: orderResults.length })
          || `Đã tạo ${orderResults.length} đơn hàng cho từng cửa hàng.`,
        );
        navigate('/order-history');
        return;
      }

      if (orderResults.length && failedGroups.length) {
        const failedNames = failedGroups
          .map((group) => group.shopName)
          .filter(Boolean)
          .join(', ');
        toast.warn(
          t('checkout.partialShopSuccess', {
            success: orderResults.length,
            failed: failedGroups.length,
          })
          || `Đã tạo ${orderResults.length} đơn, nhưng ${failedGroups.length} cửa hàng gặp lỗi.`,
          failedNames ? { toastId: `partial-${failedNames}` } : undefined,
        );
        if (failedNames) {
          toast.error(`${t('checkout.failedShopsLabel') || 'Cửa hàng lỗi'}: ${failedNames}`);
        }
        navigate('/order-history');
        return;
      }

      if (!orderResults.length && failedGroups.length) {
        const failedNames = failedGroups
          .map((group) => group.shopName)
          .filter(Boolean)
          .join(', ');
        const message = failedGroups[0]?.message
          || t('messages.orderError')
          || 'Có lỗi xảy ra khi tạo đơn hàng';
        toast.error(
          failedNames
            ? `[${failedNames}] ${message}`
            : message,
        );
        return;
      }
    } else {
      setPlacingOrder(false);
    }
  };

  const hasCartItems = cartItems.length > 0;
  const orderDisabled = !selectedAddress || !hasCartItems;

  const handlePlaceOrderClick = () => {
    if (placingOrder || orderDisabled) {
      return;
    }
    if (!termsAccepted) {
      setTermsModalOpen(true);
      return;
    }
    handlePlaceOrder();
  };

  return (
    <div className="min-h-screen flex flex-col checkout-shell">
      <Header />
      <CheckoutBanner
        breadcrumbItems={[
          { label: 'Trang chủ', href: '/' },
          { label: t('cart.title') || 'Giỏ hàng', href: '/cart' },
          { label: t('checkout.title') || 'Thanh toán' },
        ]}
      />

      <main className="flex-grow">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-12">
          {!loadingCart && !hasCartItems ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-dashed border-gray-200">
              <p className="text-lg text-gray-600 mb-6">{t('cart.empty')}</p>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-[#7a1a18] transition-colors"
              >
                {t('cart.continueShopping')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <ProductReview
                  items={cartItems}
                  loading={loadingCart}
                  currencySuffix={priceSuffix}
                />
                <AddressSelector
                  addresses={addresses}
                  isLoading={loadingAddresses}
                  selectedAddressId={selectedAddress?.id || selectedAddress?.__internalId}
                  onAddressSelect={(address) => {
                    setSelectedAddress(address);
                  }}
                  onManageClick={() => setAddressModalOpen(true)}
                  allowManage
                />
                <AddressManageModal
                  isOpen={addressModalOpen}
                  onClose={() => setAddressModalOpen(false)}
                  existingAddresses={addresses}
                  onCreated={async ({ createdAddressId } = {}) => {
                    await fetchAddresses(createdAddressId ? { preferAddressId: createdAddressId } : undefined);
                  }}
                />
                <PaymentMethod
                  selectedMethod={selectedPaymentMethod}
                  onChange={setSelectedPaymentMethod}
                  disableVnpay={hasMultipleShops}
                  vnpayDisableMessage={hasMultipleShops ? vnpayMultiShopMessage : ''}
                />
              </div>

              <div className="lg:col-span-1">
                <OrderSummary
                  subtotal={cartSummary.subtotal}
                  shipping={cartSummary.shipping}
                  shippingLoading={shippingLoading}
                  discount={voucherDiscount}
                  vouchers={voucherData}
                  selectedVoucherCode={selectedVoucherCode}
                  onVoucherSelect={setSelectedVoucherCode}
                  voucherLoading={voucherLoading}
                  total={cartSummary.total}
                  currencySuffix={priceSuffix}
                  onPlaceOrder={handlePlaceOrderClick}
                  placingOrder={placingOrder}
                  disabled={orderDisabled}
                />
                {!selectedAddress && (
                  <p className="text-sm text-red-500 mt-3 text-center">
                    {t('messages.addressRequired')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <TermsConfirmModal
        isOpen={termsModalOpen}
        checked={termsAccepted}
        confirming={placingOrder}
        onCheckedChange={setTermsAccepted}
        onViewPolicy={() => {
          try {
            sessionStorage.setItem(STORAGE_TERMS_PENDING, '1');
          } catch (error) {
            // ignore
          }
          setTermsModalOpen(false);
        }}
        onCancel={() => setTermsModalOpen(false)}
        onConfirm={() => {
          if (!termsAccepted) return;
          setTermsModalOpen(false);
          handlePlaceOrder();
        }}
      />

      <Footer />
    </div>
  );
};

export default CheckOut;
