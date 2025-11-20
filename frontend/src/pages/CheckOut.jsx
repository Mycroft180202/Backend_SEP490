import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import CheckoutBanner from '../components/checkOut/CheckoutBanner';
import ProductReview from '../components/checkOut/ProductReview';
import AddressSelector from '../components/checkOut/AddressSelector';
import PaymentMethod from '../components/checkOut/PaymentMethod';
import OrderSummary from '../components/checkOut/OrderSummary';
import { CartService } from '../services/modules/cart/cartService';
import { AuthService } from '../services/modules/auth/authService';
import { OrderService } from '../services/modules/orders/orderService';
import { GHNLocationService } from '../services/modules/shipping/ghnLocationService';
import { LanguageContext } from '../context/LanguageContext';

const normalizeAddress = (address, fallbackName = '') => {
  if (!address || typeof address !== 'object') {
    return null;
  }

  const detail = address.detailAddress
    || address.addressLine
    || address.line1
    || address.street
    || address.address
    || '';
  const detail2 = address.detailAddress2 || address.line2 || address.addressLine2 || '';
  const wardName = address.ward?.name
    || address.wardName
    || address.ward
    || '';
  const districtName = address.district?.name
    || address.districtName
    || address.district
    || '';
  const provinceName = address.province?.name
    || address.provinceName
    || address.province
    || '';

  const fullAddressParts = [detail, wardName, districtName, provinceName].filter(Boolean);
  const fallbackId =
    address.id
    || address.addressId
    || address.shippingAddressId
    || address.code
    || address.guid
    || fullAddressParts.join('-')
    || `addr-${Date.now()}`;
  const fullAddress = address.fullAddress
    || address.address
    || (fullAddressParts.length > 0 ? fullAddressParts.join(', ') : detail);

  return {
    id: fallbackId,
    name: address.name
      || address.receiverName
      || address.fullName
      || address.contactName
      || fallbackName,
    phone: address.phone
      || address.phoneNumber
      || address.contactPhone
      || '',
    fullAddress,
    line1: address.line1 || detail,
    line2: address.line2 || detail2,
    detailAddress: detail,
    detailAddress2: detail2,
    province: provinceName,
    district: districtName,
    ward: wardName,
    country: address.country || 'Vietnam',
    ghnProvinceId: address.ghnProvinceId
      ?? address.provinceId
      ?? address.ProvinceID,
    districtId: address.districtId
      ?? address.ghnDistrictId
      ?? address.DistrictID
      ?? address.toDistrictId
      ?? address.districtCode
      ?? address.district?.code
      ?? address.district?.id
      ?? null,
    wardCode: address.wardCode
      ?? address.toWardCode
      ?? address.ward?.code
      ?? address.ghnWardCode
      ?? address.WardCode
      ?? null,
    city: address.city || provinceName || '',
    isDefault: Boolean(address.isDefault),
  };
};

const sanitizePayload = (payload) => {
  const sanitized = { ...payload };
  Object.keys(sanitized).forEach((key) => {
    const value = sanitized[key];
    if (
      value === undefined
      || value === null
      || (typeof value === 'number' && Number.isNaN(value))
      || (Array.isArray(value) && value.length === 0)
    ) {
      delete sanitized[key];
    }
  });
  return sanitized;
};

const CheckOut = () => {
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const redirectTimeoutRef = useRef(null);

  const token = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null),
    [],
  );

  const priceSuffix = t('productCard.priceSuffix') || '₫';

  const calculateShipping = useCallback(async (address, weight) => {
    if (!address || !address.districtId || !address.wardCode) {
      setShippingFee(0);
      return 0;
    }
    try {
      const fee = await GHNLocationService.getShippingFee({
        toDistrictId: Number(address.districtId),
        toWardCode: address.wardCode,
        weight: weight > 0 ? Math.round(weight) : 500,
      });
      setShippingFee(fee);
      return fee;
    } catch (err) {
      console.error('Calculate shipping error:', err);
      setShippingFee(0);
      return 0;
    }
  }, []);

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
          addr.detailAddress || addr.addressLine || addr.line1 || addr.address,
          addr.detailAddress2 || addr.line2 || addr.addressLine2,
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
          city: addr.city || province || '',
          line1: addr.line1 || combinedFull || addr.detailAddress || '',
          line2: addr.line2 || addr.detailAddress2 || addr.addressLine2 || '',
          fullAddress: addr.fullAddress || combinedFull || addr.detailAddress || '',
        };
      }),
    );

    return resolved;
  }, []);

  const fetchCart = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingCart(true);
      const response = await CartService.getCart();
      const fetchedItems = response?.items || [];
      setCartItems(fetchedItems);

      const subtotal = response?.subtotal ?? fetchedItems.reduce(
        (total, item) => total + (item.price || 0) * (item.quantity || 0),
        0,
      );
      const shipping = response?.shipping ?? 0;
      const total = response?.totalAmount ?? subtotal + shipping;

      setCartSummary({
        subtotal,
        shipping,
        total,
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
  }, [t, token]);

 const fetchAddresses = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingAddresses(true);
      const profile = await AuthService.getUserInfo();
      setUserInfo(profile);

      const sourceAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];

      const prepared = sourceAddresses
        .map((address) => ({
          ...address,
          name: address.name
            || address.receiverName
            || address.contactName
            || profile?.displayName
            || profile?.fullName
            || '',
          phone: address.phone
            || address.phoneNumber
            || address.contactPhone
            || profile?.phoneNumber
            || '',
        }))
        .filter(Boolean);

      const resolved = await resolveAddressNames(prepared);

      setAddresses(resolved);
      const defaultAddress = resolved.find((addr) => addr.isDefault) || resolved[0] || null;
      setSelectedAddress(defaultAddress);
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
  }, [resolveAddressNames, t, token]);

  useEffect(() => {
    if (!token) {
      setCartItems([]);
      setCartSummary({ subtotal: 0, shipping: 0, total: 0 });
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

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [fetchAddresses, fetchCart, navigate, t, token]);

  const totalWeight = useMemo(() => (
    cartItems.reduce((total, item) => {
      const weightPerItem = Number(item?.product?.weight ?? item?.weight ?? 0);
      if (Number.isNaN(weightPerItem) || weightPerItem <= 0) {
        return total;
      }
      return total + weightPerItem * (item.quantity || 0);
    }, 0)
  ), [cartItems]);

  const handlePlaceOrder = async () => {
    if (!cartItems.length) {
      toast.info(t('messages.cartEmpty'));
      return;
    }
    if (!selectedAddress) {
      toast.error(t('messages.addressRequired'));
      return;
    }

    const shipmentItems = cartItems
      .map((item, index) => {
        const productId = item.productId
          || item.product?.id
          || item.product?.productId;
        if (!productId) {
          return null;
        }
        const baseItem = {
          productId,
          quantity: item.quantity || 1,
          price: item.price ?? item.product?.price ?? 0,
          name: item.name || item.product?.name || `Item ${index + 1}`,
          code: item.product?.sku || item.product?.productCode || productId,
        };
        const weightValue = Number(item?.product?.weight ?? item?.weight);
        if (!Number.isNaN(weightValue) && weightValue > 0) {
          baseItem.weight = weightValue;
        }
        return baseItem;
      })
      .filter(Boolean);

    if (!shipmentItems.length) {
      toast.error(t('messages.cartEmpty'));
      return;
    }

    const receiverName = selectedAddress.name
      || selectedAddress.receiverName
      || userInfo?.displayName
      || userInfo?.fullName;
    const receiverPhone = selectedAddress.phone
      || selectedAddress.phoneNumber
      || userInfo?.phoneNumber;

    const payload = sanitizePayload({
      shipingAddressId: selectedAddress.id
        || selectedAddress.addressId
        || selectedAddress.shippingAddressId,
      receiverName,
      receiverPhone,
      toDistrictId: selectedAddress.districtId
        ? Number(selectedAddress.districtId)
        : undefined,
      toWardCode: selectedAddress.wardCode,
      toAddress: selectedAddress.fullAddress || selectedAddress.detailAddress || '',
      toProvinceName: selectedAddress.province,
      totalWeight: totalWeight > 0 ? Math.round(totalWeight) : undefined,
      shipmentItems,
    });

    setPlacingOrder(true);
    try {
      const response = await OrderService.createOrder(payload);
      toast.success(t('messages.orderSuccess'));
      navigate('/order-tracking', { state: { order: response } });
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message
        || error?.response?.data?.title
        || error?.message
        || t('messages.orderError');
      toast.error(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  const hasCartItems = cartItems.length > 0;

  return (
    <div className="min-h-screen flex flex-col checkout-shell">
      <Header />
      <CheckoutBanner />

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
                  onAddressSelect={(address) => setSelectedAddress(address)}
                  onManageClick={() => navigate('/profile', { state: { from: '/checkout' } })}
                  allowManage
                />
                <PaymentMethod
                  selectedMethod={selectedPaymentMethod}
                  onChange={setSelectedPaymentMethod}
                />
              </div>

              <div className="lg:col-span-1">
                <OrderSummary
                  subtotal={cartSummary.subtotal}
                  shipping={cartSummary.shipping}
                  total={cartSummary.total}
                  currencySuffix={priceSuffix}
                  onPlaceOrder={handlePlaceOrder}
                  placingOrder={placingOrder}
                  disabled={!selectedAddress || !hasCartItems}
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

      <Footer />
    </div>
  );
};

export default CheckOut;
