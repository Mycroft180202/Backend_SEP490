import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import ShopBanner from '../components/shop/ShopBanner';
import Pagination from '../components/shared/Pagination';
import ProductCard from '../components/shared/ProductCard';
import ShopFilter from '../components/shop/ShopFilter';
import { ProductService } from '../services/modules/products/productService';
import { LanguageContext } from '../context/LanguageContext';
import { CartService } from '../services/modules/cart/cartService';
import { UserContext } from '../context/UserContext';

const Shop = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const { userInfo } = useContext(UserContext);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
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

  const handleSearchSubmit = () => {
    setSearchQuery(searchValue);
    setPageIndex(1);
  };

  const handlePageChange = (idx) => {
    setLoading(true);
    setPageIndex(idx);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        setProducts([]);

        const params = {
          pageIndex,
          pageSize,
        };

        if (selectedCategory) {
          params.categoryId = selectedCategory;
        }
        if (searchQuery) {
          params.productName = searchQuery;
        }
        if (sortOption) {
          const sortMap = {
            lowToHigh: 'lowToHigh',
            highToLow: 'highToLow',
            aToZ: 'aToZ',
            zToA: 'zToA',
          };
          params.sortOrder = sortMap[sortOption] || '';
        }

        const response = await ProductService.getAllProducts(params);
        if (!isMounted) return;

        setProducts(response.items || []);
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
  }, [pageIndex, pageSize, selectedCategory, searchQuery, sortOption]);

  return (
    <div className="bg-gradient-to-b from-[#FFFBF0] to-[#FFF8E7] min-h-screen">
      <Header />
      <ShopBanner onSelect={(label) => setSelectedCategory(label)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error ? (
          <div className="text-center text-red-600 text-lg">
            {`${t('general.errorPrefix')}${error}`}
          </div>
        ) : (
          <>
            <ShopFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              onSearchSubmit={handleSearchSubmit}
              sortOption={sortOption}
              onSortChange={setSortOption}
            />

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
              {loading ? (
                Array.from({ length: 12 }).map((_, idx) => <ProductCard key={idx} loading />)
              ) : products.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl shadow-lg">
                  <div className="text-6xl mb-4">:/</div>
                  <p className="text-xl font-['Nunito'] text-gray-500">{t('shop.empty')}</p>
                </div>
              ) : (
                products.map((product) => (
                  <ProductCard
                    key={product.id}
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

            <div className="flex justify-center mt-12">
              <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={handlePageChange} />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
