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
import Pagination from '../components/shared/Pagination';
import { CartService } from '../services/modules/cart/cartService';
import { LanguageContext } from '../context/LanguageContext';

const Cart = () => {
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ subtotal: 0, shipping: 0, total: 0 });
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 6;
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
      setPageIndex(1);
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

    setUpdatingItemId(cartItemId);
    try {
      await CartService.updateItem(cartItemId, normalizedQuantity);
      if (!options?.manual) {
        toast.success(t('messages.cartUpdateSuccess'));
      }
      await fetchCart();
      return { success: true, quantity: normalizedQuantity };
    } catch (error) {
      console.error(error);
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

  const handleCheckout = () => {
    if (!token) {
      toast.info(t('messages.loginRequired'));
      navigate('/login', { replace: true, state: { from: '/cart' } });
      return;
    }
    if (!items.length) {
      toast.info(t('messages.cartEmpty'));
      return;
    }

    const unavailableItems = items.filter((item) => isUnavailable(item));
    if (unavailableItems.length) {
      const availableExists = items.some((item) => !isUnavailable(item));
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
    navigate('/checkout');
  };

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

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
          items={paginatedItems}
          allItems={items}
          loading={loading}
          updatingItemId={updatingItemId}
          summary={summary}
          totalCount={items.length}
          onQuantityChange={handleQuantityChange}
          onRemove={handleRemoveItem}
          onCheckout={handleCheckout}
        />
        {!loading && items.length > pageSize && (
          <div className="flex justify-center mt-8 mb-6">
            <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={setPageIndex} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
