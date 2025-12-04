import React, { useContext, useEffect, useMemo, useState } from 'react';
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
import ShopFilter from '../components/shop/ShopFilter';
import { CartService } from '../services/modules/cart/cartService';
import { LanguageContext } from '../context/LanguageContext';
import { UserContext } from '../context/UserContext';

const extractAddress = (addresses, fallbackAddress) => {
  if (fallbackAddress) return fallbackAddress;
  if (Array.isArray(addresses) && addresses.length) {
    const primary = addresses.find((addr) => addr?.isDefault) || addresses[0];
    return (
      primary?.city
      || primary?.district
      || primary?.line1
      || primary?.addressLine
      || primary?.fullAddress
      || ''
    );
  }
  return '';
};

const normalizeShopInfo = (data, fallback = {}) => {
  if (!data && !fallback) return null;
  return {
    title: data?.shopName || data?.displayName || fallback.title || 'Gian hàng',
    author: data?.displayName || fallback.author || '',
    subtitle: data?.bio || fallback.subtitle || '',
    rating: data?.rating ?? fallback.rating ?? null,
    phone: data?.phoneNumber || fallback.phone || '',
    image: data?.shopUrlImage || fallback.image || '',
    address: extractAddress(data?.addresses, fallback.address),
    artisanId: data?.userID || data?.userId || fallback.artisanId || null,
  };
};

const resolveProductCategoryId = (product) => {
  if (!product) return null;
  const candidate =
    product.categoryId
    ?? product.categoryID
    ?? product.category?.id
    ?? product.category?.categoryId
    ?? product.category?.categoryID
    ?? product.categoryCode
    ?? (Array.isArray(product.categories) ? product.categories[0] : null)
    ?? product.category
    ?? null;

  if (candidate && typeof candidate === 'object') {
    return (
      candidate.id
      ?? candidate.categoryId
      ?? candidate.categoryID
      ?? candidate.value
      ?? null
    );
  }

  return candidate ?? null;
};

const ArtisanShop = () => {
  const { t } = useContext(LanguageContext);
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const externalArtisanId = searchParams.get('artisanId');
  const externalState = useMemo(() => location.state || {}, [location.state]);

  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [shopInfo, setShopInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('');
  const currentUserId = userInfo?.userID || userInfo?.userId;

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
          return;
        }
        setLoading(true);
        const aggregated = [];
        let page = 1;
        let hasNext = true;
        while (hasNext) {
          const response = await ProductService.getAllProducts({ pageIndex: page, pageSize: 50 });
          if (!isMounted) return;
          const items = response.items || [];
          aggregated.push(
            ...items.filter((p) => (p.artisanId || p.artisanID) === shopInfo.artisanId),
          );
          const totalPagesFromResponse = response?.totalPages;
          if (typeof response?.hasNextPage === 'boolean') {
            hasNext = response.hasNextPage;
          } else if (totalPagesFromResponse && totalPagesFromResponse > 0) {
            hasNext = page < totalPagesFromResponse;
          } else {
            hasNext = items.length === 50;
          }
          page += 1;
        }
        setAllProducts(aggregated);
        setPageIndex(1);
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
  }, [shopInfo?.artisanId]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId ?? null);
    setPageIndex(1);
  };

  const handleSearchSubmit = () => {
    setSearchQuery(searchValue.trim());
    setPageIndex(1);
  };

  const handleSortChange = (value) => {
    setSortOption(value);
    setPageIndex(1);
  };

  const filteredProducts = useMemo(() => {
    let working = Array.isArray(allProducts) ? [...allProducts] : [];

    if (selectedCategory !== null && selectedCategory !== undefined && selectedCategory !== '') {
      working = working.filter((product) => {
        const categoryValue = resolveProductCategoryId(product);
        if (categoryValue == null) {
          return false;
        }
        return String(categoryValue) === String(selectedCategory);
      });
    }

    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (normalizedSearch) {
      working = working.filter((product) => {
        const name = (product?.name || '').toLowerCase();
        const description = (product?.shortDescription || product?.description || '').toLowerCase();
        const sku = (product?.sku || '').toLowerCase();
        return (
          name.includes(normalizedSearch)
          || description.includes(normalizedSearch)
          || sku.includes(normalizedSearch)
        );
      });
    }

    switch (sortOption) {
      case 'lowToHigh':
        working.sort((a, b) => (Number(a?.price) || 0) - (Number(b?.price) || 0));
        break;
      case 'highToLow':
        working.sort((a, b) => (Number(b?.price) || 0) - (Number(a?.price) || 0));
        break;
      case 'aToZ':
        working.sort((a, b) => (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' }));
        break;
      case 'zToA':
        working.sort((a, b) => (b?.name || '').localeCompare(a?.name || '', undefined, { sensitivity: 'base' }));
        break;
      default:
        break;
    }

    return working;
  }, [allProducts, searchQuery, selectedCategory, sortOption]);

  useEffect(() => {
    const maxPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
    setTotalPages(maxPages);
    if (pageIndex > maxPages) {
      setPageIndex(1);
      return;
    }
    const start = (pageIndex - 1) * pageSize;
    const paginated = filteredProducts.slice(start, start + pageSize);
    setProducts(paginated);
  }, [filteredProducts, pageIndex, pageSize]);

  useEffect(() => {
    const loadShop = async () => {
      setAllProducts([]);
      setProducts([]);
      setTotalPages(1);
      setPageIndex(1);
      setSelectedCategory(null);
      setSearchValue('');
      setSearchQuery('');
      setSortOption('');
      try {
        if (externalArtisanId) {
          if (currentUserId && externalArtisanId === currentUserId) {
            const res = await ShopService.getMyShop();
            setShopInfo(normalizeShopInfo(res));
          } else {
            const res = await ShopService.getShopByUserId(externalArtisanId);
            if (!res) {
              const message = 'Không tìm thấy thông tin cửa hàng';
              toast.error(message);
              setError(message);
              setShopInfo(null);
              return;
            }
            setShopInfo(
              normalizeShopInfo(res, {
                title: externalState.shopName,
                author: externalState.author,
                subtitle: externalState.subtitle,
                rating: externalState.rating,
                phone: externalState.phone,
                image: externalState.image,
                address: externalState.address,
                artisanId: externalArtisanId,
              }),
            );
          }
        } else if (currentUserId) {
          const res = await ShopService.getMyShop();
          setShopInfo(normalizeShopInfo(res));
          setError(null);
        } else {
          setShopInfo(null);
          setError(null);
        }
      } catch (err) {
        console.error('Load shop error:', err);
        const message =
          err?.response?.data?.message
          || err?.message
          || 'Không thể tải thông tin cửa hàng';
        toast.error(message);
        setError(message);
        setShopInfo(null);
      }
    };
    loadShop();
  }, [externalArtisanId, currentUserId, externalState]);

  const handlePageChange = (idx) => {
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
        breadcrumbItems={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Cửa hàng', href: '/shop' },
          { label: shopInfo?.title || 'Gian hàng' },
        ]}
        showAddress={false}
        showPhone={false}
        showRating={false}
      />
      <FilterSection artisanId={shopInfo?.artisanId} />
      <main className="max-w-screen-xl mx-auto px-6 md:px-8 py-12">
        <ShopFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSearchSubmit={handleSearchSubmit}
          sortOption={sortOption}
          onSortChange={handleSortChange}
          showHeading={false}
        />
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
                  stock={product.stock}
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

