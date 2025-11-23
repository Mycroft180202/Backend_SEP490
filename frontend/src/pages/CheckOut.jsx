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
  const shippingFeeRef = useRef(0);
  const redirectTimeoutRef = useRef(null);

  const token = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null),
    [],
  );

  const priceSuffix = t('productCard.priceSuffix') || '₫';

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
    return addresses;
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
      // Prefer client-calculated shippingFee (from GHN) to avoid flicker/overwrite
      const serverShipping = response?.shipping ?? 0;
      const currentShippingFee = shippingFeeRef.current;
      const shipping = (currentShippingFee && Number.isFinite(currentShippingFee) && currentShippingFee > 0)
        ? currentShippingFee
        : serverShipping || 0;

      setCartSummary((prev) => {
        // If a positive shipping was already set (from GHN calc), preserve it to avoid overwriting
        const preservedShipping = prev?.shipping && Number.isFinite(prev.shipping) && prev.shipping > 0
          ? prev.shipping
          : shipping;
        const computedTotal = subtotal + (preservedShipping || 0);
        return {
          ...prev,
          subtotal,
          shipping: preservedShipping,
          total: response?.totalAmount ?? computedTotal,
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

  // First-load: calculate immediately when both cart and addresses finish loading and address is selected
  useEffect(() => {
    let mounted = true;
    const doImmediateCalc = async () => {
      if (!selectedAddress) {
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
  }, [loadingCart, loadingAddresses, selectedAddress, totalWeight, calculateShipping]);

  // Recalculate shipping when selected address or cart weight changes (with debounce)
  useEffect(() => {
    let mounted = true;
    let timer = null;
    const scheduleCalc = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (!selectedAddress) {
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
  }, [selectedAddress, totalWeight, calculateShipping, loadingCart, loadingAddresses]);

  const handlePlaceOrder = async () => {
    if (!cartItems.length) {
      toast.info(t('messages.cartEmpty'));
      return;
    }
    if (!selectedAddress) {
      toast.error(t('messages.addressRequired'));
      return;
    }

    const cartItemsPayload = cartItems
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
    };

    setPlacingOrder(true);
    try {
      const response = await OrderService.createOrder(payload);

      // Handle successful response
      if (response?.data?.success || response?.success) {
        const orderData = response.data || response;

        // For COD: Show success page
        if (orderData.paymentMethod === 'COD') {
          toast.success(t('messages.orderSuccess') || 'Đơn hàng được tạo thành công');
          navigate('/order-success', { state: { order: orderData } });
        }
        // For VNPAY: Redirect to payment URL
        else if (orderData.paymentMethod === 'VNPAY' && orderData.paymentUrl) {
          toast.info('Đang chuyển hướng đến VNPAY...');
          // Store order data in session storage for later retrieval
          sessionStorage.setItem('vnpayOrderData', JSON.stringify(orderData));
          // Redirect to payment URL
          window.location.href = orderData.paymentUrl;
        } else {
          // Fallback: show success page anyway
          toast.success(t('messages.orderSuccess') || 'Đơn hàng được tạo thành công');
          navigate('/order-success', { state: { order: orderData } });
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
                  onAddressSelect={(address) => {
                    setSelectedAddress(address);
                  }}
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
                  shippingLoading={shippingLoading}
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
