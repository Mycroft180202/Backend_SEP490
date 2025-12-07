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
import { VoucherService } from '../services/modules/voucher/voucherService';
import { LanguageContext } from '../context/LanguageContext';
import { NavigationKeys } from '../context/NavigationContext';
import useNavigationNode from '../hooks/useNavigationNode';

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
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [voucherData, setVoucherData] = useState({ shared: [], personal: [] });
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState('');
  const shippingFeeRef = useRef(0);
  const redirectTimeoutRef = useRef(null);

  const token = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null),
    [],
  );

  const priceSuffix = t('productCard.priceSuffix') || '₫';

  const checkoutNavigationNode = useMemo(() => {
    const label = t('checkout.title');
    return {
      label: label && label !== 'checkout.title' ? label : 'Thanh toán',
      href: '/checkout',
    };
  }, [t]);

  useNavigationNode(NavigationKeys.LAST_PROFILE_ENTRY, checkoutNavigationNode);

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

  const fetchCart = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingCart(true);
      const response = await CartService.getCart();
      const fetchedItems = response?.items || [];
      const availableItems = fetchedItems.filter((item) => !isUnavailable(item));
      if (availableItems.length !== fetchedItems.length) {
        toast.info('Một số sản phẩm đã hết hàng và được loại khỏi đơn thanh toán.');
      }
      setCartItems(availableItems);

      if (!availableItems.length) {
        setShippingFee(0);
      }

      const subtotal = availableItems.reduce(
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
        const hasItems = availableItems.length > 0;
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
  }, [t, token]);

  const fetchAddresses = useCallback(async () => {
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

    const cartItemsPayload = validCartItems
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

    if (!cartItemsPayload.length) {
      toast.error(t('messages.cartEmpty'));
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

    const summaryBeforeDiscount = ensureNumber(cartSummary.subtotal) + latestShippingFee;
    const discountValue = ensureNumber(voucherDiscount);
    const computedTotal = Math.max(summaryBeforeDiscount - discountValue, 0);

    const clientSummary = {
      subtotal: ensureNumber(cartSummary.subtotal),
      shippingFee: latestShippingFee,
      discount: discountValue,
      total: computedTotal,
    };

    // Build new order payload format
    const payload = {
      cartItems: cartItemsPayload,
      addressId,
      paymentMethod,
      // Fixed defaults as per API spec
      shippingServiceId: 53321,
      paymentTypeId: 2,
      serviceTypeId: 2,
      bankCode: 'NCB',
      requiredNote: 'KHONGCHOXEMHANG',
      subtotal: clientSummary.subtotal,
      shippingFee: clientSummary.shippingFee,
      discountAmount: clientSummary.discount,
      totalAmount: clientSummary.total,
    };
    if (selectedVoucherCode) {
      payload.voucherCodeId = selectedVoucherCode;
    }

    setPlacingOrder(true);
    try {
      const response = await OrderService.createOrder(payload);

      // Handle successful response
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
        if (enrichedOrderData.total === undefined && enrichedOrderData.totalAmount === undefined) {
          enrichedOrderData.total = clientSummary.total;
        }

        // For COD: Show success page
        if (enrichedOrderData.paymentMethod === 'COD') {
          toast.success(t('messages.orderSuccess') || 'Đơn hàng được tạo thành công');
          sessionStorage.setItem('lastOrderSuccess', JSON.stringify(enrichedOrderData));
          navigate('/order-success', { state: { order: enrichedOrderData } });
        }
        // For VNPAY: Redirect to payment URL
        else if (enrichedOrderData.paymentMethod === 'VNPAY' && enrichedOrderData.paymentUrl) {
          toast.info('Đang chuyển hướng đến VNPAY...');
          // Store order data in session storage for later retrieval
          sessionStorage.setItem('vnpayOrderData', JSON.stringify(enrichedOrderData));
          // Redirect to payment URL
          window.location.href = enrichedOrderData.paymentUrl;
        } else {
          // Fallback: show success page anyway
          toast.success(t('messages.orderSuccess') || 'Đơn hàng được tạo thành công');
          sessionStorage.setItem('lastOrderSuccess', JSON.stringify(enrichedOrderData));
          navigate('/order-success', { state: { order: enrichedOrderData } });
        }
      } else {
        // Unexpected response format
        toast.error(t('messages.orderError') || 'Có lỗi xảy ra');
        setPlacingOrder(false);
      }
    } catch (error) {
      console.error('Order creation error:', error);
      const message =
        error?.response?.data?.message
        || error?.response?.data?.title
        || error?.message
        || t('messages.orderError')
        || 'Có lỗi xảy ra khi tạo đơn hàng';
      toast.error(message);
      setPlacingOrder(false);
    }
  };

  const hasCartItems = cartItems.length > 0;

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
                  onManageClick={() => navigate('/profile', {
                    state: {
                      from: '/checkout',
                      fromProfileOrigin: checkoutNavigationNode,
                      profileFocus: 'addresses',
                    },
                  })}
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
                  shippingLoading={shippingLoading}
                  discount={voucherDiscount}
                  vouchers={voucherData}
                  selectedVoucherCode={selectedVoucherCode}
                  onVoucherSelect={setSelectedVoucherCode}
                  voucherLoading={voucherLoading}
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
