import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import Banner from '../components/artisanShop/Banner';
import { ProductService } from '../services/modules/products/productService';
import { ShopService } from '../services/modules/shop/shopService';
import Pagination from '../components/shared/Pagination';
import ProductCard from '../components/shared/ProductCard';
import FilterSection from '../components/artisanShop/FilterSection';
import { CartService } from '../services/modules/cart/cartService';
import { LanguageContext } from '../context/LanguageContext';
import { UserContext } from '../context/UserContext';

const ArtisanShop = () => {
  const { t } = useContext(LanguageContext);
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const externalArtisanId = searchParams.get('artisanId');
  const externalState = location.state || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [shopInfo, setShopInfo] = useState(null);

  const ensureAuthenticated = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) return true;
    if (!userInfo) {
      toast.info(t('messages.loginRequired'));
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 500);
    }
    return false;
  };

  const handleAddToCart = async (productId, price, quantity = 1, redirect = false) => {
    if (!ensureAuthenticated()) return;
    try {
      await CartService.addItem(productId, price, quantity);
      toast.success(redirect ? t('messages.addedToCartRedirect') : t('messages.addedToCart'));
      if (redirect) {
        navigate('/cart');
      }
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message
        || err?.response?.data?.title
        || err?.message
        || t('messages.addToCartError');
      toast.error(message);
    }
  };

  const handleBuyNow = async (productId, price) => {
    await handleAddToCart(productId, price, 1, true);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        if (!isMounted) return;
        if (!shopInfo?.artisanId) {
          // Chưa có thông tin shop => chờ shopInfo
          return;
        }
        setLoading(true);
        const response = await ProductService.getAllProducts({ pageIndex, pageSize });
        if (!isMounted) return;
        const items = response.items || [];
        const filtered = items.filter((p) => (p.artisanId || p.artisanID) === shopInfo.artisanId);
        setProducts(filtered);
        setTotalPages(
          response.totalPages && response.totalPages > 0
            ? response.totalPages
            : Math.ceil((response.totalCount || 0) / pageSize),
        );
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || 'Unknown error');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [pageIndex, pageSize, shopInfo?.artisanId]);

  useEffect(() => {
    const loadShop = async () => {
      try {
        if (externalArtisanId) {
          setShopInfo({
            title: externalState.shopName || externalState.author || 'Gian hàng',
            author: externalState.author,
            subtitle: externalState.subtitle,
            rating: externalState.rating,
            phone: externalState.phone,
            image: externalState.image,
            address: externalState.address,
            artisanId: externalArtisanId,
          });
          setPageIndex(1);
          return;
        }
        const res = await ShopService.getMyShop();
        const addr = Array.isArray(res?.addresses) ? res.addresses.find((a) => a.isDefault) : null;
        setShopInfo({
          title: res?.shopName,
          author: res?.displayName,
          subtitle: res?.bio,
          rating: res?.rating,
          phone: res?.phoneNumber,
          image: res?.shopUrlImage,
          address: addr?.city || addr?.line1 || '',
          artisanId: res?.userID || res?.userId,
        });
        setPageIndex(1); // reset page when shop changes
      } catch (err) {
        console.error('Load my shop error:', err);
      }
    };
    loadShop();
  }, [externalArtisanId, externalState]);

  const handlePageChange = (idx) => {
    setLoading(true);
    setPageIndex(idx);
  };

  if (error) {
    return <div className="text-center text-red-600 mt-10">{`${t('general.errorPrefix')}${error}`}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Banner
        title={shopInfo?.title}
        author={shopInfo?.author}
        subtitle={shopInfo?.subtitle || ''}
        rating={shopInfo?.rating}
        address={shopInfo?.address}
        image={shopInfo?.image}
        phone={shopInfo?.phone}
      />
      <FilterSection artisanId={shopInfo?.artisanId} />
      <main className="max-w-screen-xl mx-auto px-6 md:px-8 py-12">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 12 }).map((_, idx) => <ProductCard key={idx} loading />)
          ) : products.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">
              {t('shop.empty')}
            </div>
          ) : (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  productId={product.id}
                  image={product.imageUrl || '/images/default-product.png'}
                  title={product.name}
                  shortDescription={product.shortDescription}
                  price={product.price}
                  rating={product.rating || 0}
                onAddToCart={() => handleAddToCart(product.id, product.price ?? 0)}
                onBuyNow={() => handleBuyNow(product.id, product.price ?? 0)}
                onClick={() => navigate(`/product-detail/${product.id}`)}
              />
            ))
          )}
        </section>

        <div className="flex justify-center mt-10">
          <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={handlePageChange} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArtisanShop;

