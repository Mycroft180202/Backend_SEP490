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

  const handleQuantityChange = async (cartItemId, quantity) => {
    if (quantity <= 0) {
      await handleRemoveItem(cartItemId);
      return;
    }
    setUpdatingItemId(cartItemId);
    try {
      await CartService.updateItem(cartItemId, quantity);
      toast.success(t('messages.cartUpdateSuccess'));
      fetchCart();
    } catch (error) {
      console.error(error);
      const message =
        error?.response?.data?.message
        || error?.response?.data?.title
        || error?.message
        || t('messages.cartUpdateError');
      toast.error(message);
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
    navigate('/checkout');
  };

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <CartBanner />
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
