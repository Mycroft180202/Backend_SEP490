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
import CartBanner from '../components/cart/CartBanner';
import ProductList from '../components/cart/ProductList';
import { CartService } from '../services/modules/cart/cartService';
import { LanguageContext } from '../context/LanguageContext';
import { NavigationKeys } from '../context/NavigationContext';
import useNavigationNode from '../hooks/useNavigationNode';

const Cart = () => {
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ subtotal: 0, shipping: 0, total: 0 });
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const toastShownRef = useRef(false);
  const redirectTimeoutRef = useRef(null);

  const token = useMemo(
    () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null),
    [],
  );

  const fetchCart = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await CartService.getCart();
      const normalized = response.items || [];
      setItems(normalized);

      const subtotal = response.subtotal ?? normalized.reduce(
        (total, item) => total + (item.price || 0) * (item.quantity || 0),
        0,
      );
      const shipping = 0;
      const total = response.totalAmount ?? subtotal + shipping;
      setSummary({ subtotal, shipping, total });
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message
        || error?.response?.data?.title
        || error?.message
        || t('messages.cartLoadError');
      toast.error(message);
      toast.info(t('cart.emptyInfo'));
    } finally {
      setLoading(false);
    }
  }, [t, token]);

  const cartTitle = t('cart.title');
  const cartListNode = useMemo(() => ({
    label: cartTitle && cartTitle !== 'cart.title' ? cartTitle : 'Giỏ hàng',
    href: '/cart',
    meta: {
      totalItems: items.length,
    },
  }), [cartTitle, items.length]);

  useNavigationNode(NavigationKeys.LAST_PRODUCT_LIST, cartListNode);

  useEffect(() => {
    if (!token) {
      if (!toastShownRef.current) {
        toast.info(t('messages.loginRequired'));
        toastShownRef.current = true;
      }
      setItems([]);
      setSummary({ subtotal: 0, shipping: 0, total: 0 });
      setLoading(false);

      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = setTimeout(() => {
        navigate('/login', { replace: true, state: { from: '/cart' } });
      }, 1200);

      return () => {
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
      };
    }

    fetchCart();

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [fetchCart, navigate, t, token]);

  const handleQuantityChange = async (cartItemId, quantity, options = {}) => {
    const targetItem = items.find(
      (item) => (item.cartItemId || item.id) === cartItemId,
    );

    if (!targetItem) {
      toast.error('Sản phẩm không tồn tại trong giỏ hàng.');
      return { success: false, quantity: 1 };
    }

    if (Number.isNaN(Number(quantity))) {
      toast.warning('Vui lòng nhập số lượng hợp lệ.');
      return { success: false, quantity: targetItem.quantity ?? 1 };
    }

    const normalizedQuantity = Math.floor(Number(quantity));

    if (normalizedQuantity <= 0) {
      toast.warning('Số lượng tối thiểu là 1. Nếu muốn xoá sản phẩm, vui lòng dùng nút Xóa.');
      return { success: false, quantity: targetItem.quantity ?? 1 };
    }

    const stockLimit = Number(targetItem.stock);
    if (Number.isFinite(stockLimit) && stockLimit > 0 && normalizedQuantity > stockLimit) {
      const fallback = Math.max(1, Math.min(stockLimit, targetItem.quantity ?? 1));
      toast.warning(`Không thể thêm vào giỏ hàng vì sản phẩm này chỉ còn ${stockLimit} trong kho.`);
      return { success: false, quantity: fallback };
    }

    if (normalizedQuantity === (targetItem.quantity ?? 0)) {
      return { success: true, quantity: normalizedQuantity };
    }

    const previousItems = items.map((item) => ({ ...item }));
    const previousShipping = summary?.shipping ?? 0;
    const previousSubtotal = previousItems.reduce(
      (total, current) => total + (current.price || 0) * (current.quantity || 0),
      0,
    );
    const previousSummary = summary
      ? { ...summary }
      : {
        subtotal: previousSubtotal,
        shipping: previousShipping,
        total: previousSubtotal + previousShipping,
      };

    const nextItems = previousItems.map((item) => (
      (item.cartItemId || item.id) === cartItemId
        ? { ...item, quantity: normalizedQuantity }
        : item
    ));
    const shippingFee = previousSummary?.shipping ?? 0;
    const nextSubtotal = nextItems.reduce(
      (total, current) => total + (current.price || 0) * (current.quantity || 0),
      0,
    );
    const nextSummary = {
      subtotal: nextSubtotal,
      shipping: shippingFee,
      total: nextSubtotal + shippingFee,
    };

    setItems(nextItems);
    setSummary(nextSummary);
    setUpdatingItemId(cartItemId);

    try {
      await CartService.updateItem(cartItemId, normalizedQuantity);
      if (!options?.manual) {
        toast.success(t('messages.cartUpdateSuccess'));
      }
      return { success: true, quantity: normalizedQuantity };
    } catch (error) {
      console.error(error);
      setItems(previousItems);
      setSummary(previousSummary);
      const message =
        error?.response?.data?.message
        || error?.response?.data?.title
        || error?.message
        || t('messages.cartUpdateError');
      toast.error(message);
      return { success: false, quantity: targetItem.quantity ?? 1 };
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    setUpdatingItemId(cartItemId);
    try {
      await CartService.removeItem(cartItemId);
      toast.success(t('messages.cartRemoveSuccess'));
      fetchCart();
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message
        || error?.response?.data?.title
        || error?.message
        || t('messages.cartRemoveError');
      toast.error(message);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const isUnavailable = (item) => (
    item?.isActive === false
    || (typeof item?.stock === 'number' && Number(item.stock) <= 0)
  );

  const handleCheckout = (selectedItems = items) => {
    if (!token) {
      toast.info(t('messages.loginRequired'));
      navigate('/login', { replace: true, state: { from: '/cart' } });
      return;
    }

    const targetItems = Array.isArray(selectedItems) && selectedItems.length
      ? selectedItems
      : items;

    if (!targetItems.length) {
      toast.info(t('messages.cartEmpty'));
      return;
    }

    const unavailableItems = targetItems.filter((item) => isUnavailable(item));
    if (unavailableItems.length) {
      const availableExists = targetItems.some((item) => !isUnavailable(item));
      if (!availableExists) {
        toast.error(t('cart.unavailableOnly'));
        return;
      }
      const confirmMessage = t('cart.unavailableConfirm');
      // in case window undefined (SSR), fallback to proceed automatically
      const confirmProceed = typeof window !== 'undefined' ? window.confirm(confirmMessage) : true;
      if (!confirmProceed) {
        return;
      }
    }

    const selectedIds = targetItems
      .map((item) => item.cartItemId || item.id)
      .filter(Boolean)
      .map((value) => String(value));

    if (selectedIds.length) {
      try {
        sessionStorage.setItem('checkoutSelectedCartIds', JSON.stringify(selectedIds));
      } catch (error) {
        console.warn('Unable to persist selected cart items:', error);
      }
    }

    navigate('/checkout', selectedIds.length ? { state: { selectedCartIds: selectedIds } } : undefined);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <CartBanner
        breadcrumbItems={[
          { label: t('nav.home'), href: '/' },
          { label: t('cart.title') || 'Giỏ hàng' },
        ]}
      />
      <main className="flex-grow">
        <ProductList
          items={items}
          loading={loading}
          updatingItemId={updatingItemId}
          summary={summary}
          totalCount={items.length}
          onQuantityChange={handleQuantityChange}
          onRemove={handleRemoveItem}
          onCheckout={handleCheckout}
          originNode={cartListNode}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
