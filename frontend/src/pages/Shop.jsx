import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { WishlistService } from '../services/modules/wishlist/wishlistService';
import { isOwnedByCurrentArtisan, resolveProductId } from '../utils/productOwnership';
import { NavigationKeys } from '../context/NavigationContext';
import useResolvedNavigationNode from '../hooks/useResolvedNavigationNode';
import useNavigationNode from '../hooks/useNavigationNode';

const Shop = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const presetFilters = location.state?.shopPreset;
  const { t } = useContext(LanguageContext);
  const { userInfo } = useContext(UserContext);
  const activeProduct = useResolvedNavigationNode({
    locationKey: 'fromProduct',
    contextKey: NavigationKeys.LAST_PRODUCT,
  });
  const productListNode = useResolvedNavigationNode({
    locationKey: 'fromProductList',
    contextKey: NavigationKeys.LAST_PRODUCT_LIST,
  });
  const breadcrumbItems = useMemo(() => {
    const items = [{ label: t('nav.home'), href: '/' }];
    if (activeProduct?.label && activeProduct?.href) {
      items.push({ label: activeProduct.label, href: activeProduct.href });
    }
    items.push({ label: t('nav.shop') });
    return items;
  }, [activeProduct?.href, activeProduct?.label, t]);
  const resolveMessage = (key, fallback) => {
    const value = t(key);
    if (value && value !== key) {
      return value;
    }
    return fallback || key;
  };

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
  const [wishlistMap, setWishlistMap] = useState(new Map());
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  useEffect(() => {
    if (filtersInitialized) {
      return;
    }

    if (presetFilters) {
      if (presetFilters.category !== undefined) setSelectedCategory(presetFilters.category);
      if (presetFilters.searchValue !== undefined) setSearchValue(presetFilters.searchValue ?? '');
      if (presetFilters.searchQuery !== undefined) {
        setSearchQuery(presetFilters.searchQuery ?? '');
      } else if (presetFilters.searchValue !== undefined) {
        setSearchQuery(presetFilters.searchValue ?? '');
      }
      if (presetFilters.sortOption !== undefined) setSortOption(presetFilters.sortOption ?? '');
      if (presetFilters.pageIndex !== undefined) {
        const parsedIndex = Number(presetFilters.pageIndex);
        setPageIndex(Number.isFinite(parsedIndex) && parsedIndex > 0 ? parsedIndex : 1);
      } else {
        setPageIndex(1);
      }
      setFiltersInitialized(true);
      return;
    }

    const hasProductListState = Boolean(location.state?.fromProductList);
    const meta = hasProductListState ? productListNode?.meta : null;
    if (meta) {
      if (meta.category !== undefined) setSelectedCategory(meta.category);
      if (meta.searchValue !== undefined) setSearchValue(meta.searchValue);
      if (meta.searchQuery !== undefined) setSearchQuery(meta.searchQuery);
      if (meta.sortOption !== undefined) setSortOption(meta.sortOption);
      if (meta.pageIndex !== undefined) setPageIndex(meta.pageIndex);
    } else {
      setSelectedCategory(null);
      setSearchValue('');
      setSearchQuery('');
      setSortOption('');
      setPageIndex(1);
    }
    setFiltersInitialized(true);
  }, [filtersInitialized, location.state?.fromProductList, presetFilters, productListNode]);

  const shopListNode = useMemo(() => ({
    label: t('nav.shop'),
    href: '/shop',
    meta: {
      category: selectedCategory,
      searchValue,
      searchQuery,
      sortOption,
      pageIndex,
    },
  }), [pageIndex, searchQuery, searchValue, selectedCategory, sortOption, t]);

  useNavigationNode(NavigationKeys.LAST_PRODUCT_LIST, shopListNode);
  const ensureAuthenticated = (messageKey, fallbackMessage) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) return true;
    if (!userInfo) {
      toast.info(resolveMessage(messageKey || 'messages.loginRequired', fallbackMessage));
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 500);
    }
    return false;
  };

  const resolveOwnProductMessage = () => {
    const message = t('messages.cannotBuyOwnProduct');
    if (message && message !== 'messages.cannotBuyOwnProduct') {
      return message;
    }
    return 'Bạn không thể mua sản phẩm của chính mình.';
  };

  const handleAddToCart = async (productOrId, price, quantity = 1, redirect = false) => {
    const productId = resolveProductId(productOrId);
    if (!productId) {
      toast.error(resolveMessage('messages.productUnavailable', 'Sản phẩm không khả dụng.'));
      return;
    }

    if (isOwnedByCurrentArtisan(productOrId && typeof productOrId === 'object' ? productOrId : null, userInfo)) {
      toast.info(resolveOwnProductMessage());
      return;
    }

    if (!ensureAuthenticated('messages.loginToAddCart', 'Đăng nhập để thêm vào giỏ hàng.')) return;
    try {
      const stock = productOrId && typeof productOrId === 'object' ? productOrId.stock : undefined;
      const result = await CartService.addItemValidated(productId, price, quantity, stock);
      if (!result?.success) {
        toast.error(
          result?.message
          || resolveMessage('messages.addToCartError', 'Không thể thêm sản phẩm vào giỏ hàng.'),
        );
        return;
      }

      if (result.limited) {
        toast.info(`Chỉ thêm được ${result.added} sản phẩm do tồn kho.`);
      } else {
        toast.success(redirect ? t('messages.addedToCartRedirect') : t('messages.addedToCart'));
      }
      if (redirect) {
        navigate('/cart');
      }
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) {
        const loginMsg = resolveMessage('messages.loginRequired', 'Vui lòng đăng nhập để tiếp tục.');
        toast.error(loginMsg);
        return;
      }
      const message =
        err?.response?.data?.message
        || err?.response?.data?.title
        || err?.message
        || resolveMessage('messages.addToCartError', 'Không thể thêm sản phẩm vào giỏ hàng.');
      toast.error(message);
    }
  };

  const handleBuyNow = async (productOrId, price) => {
    if (!ensureAuthenticated('messages.loginToBuyNow', 'Đăng nhập để mua ngay.')) return;
    await handleAddToCart(productOrId, price, 1, true);
  };

  const refreshWishlist = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setWishlistMap(new Map());
      return;
    }
    try {
      const res = await WishlistService.getList(1, 200);
      const items = res?.items || res?.Items || [];
      const map = new Map();
      items.forEach((i) => {
        const pid = i.productId || i.product?.id;
        if (pid) {
          map.set(pid, i.wishListItemId || i.id);
        }
      });
      setWishlistMap(map);
    } catch (err) {
      console.error('Load wishlist error:', err);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!ensureAuthenticated('messages.wishlistLoginRequired', 'Đăng nhập để quản lý danh sách yêu thích.')) return;
    try {
      if (wishlistMap.has(productId)) {
        const itemId = wishlistMap.get(productId);
        if (itemId) {
          await WishlistService.remove(itemId);
        }
        const newMap = new Map(wishlistMap);
        newMap.delete(productId);
        setWishlistMap(newMap);
        toast.success(resolveMessage('messages.wishlistRemoved', 'Đã xóa khỏi yêu thích.'));
      } else {
        await WishlistService.add(productId);
        await refreshWishlist();
        toast.success(resolveMessage('messages.wishlistAdded', 'Đã thêm vào yêu thích.'));
      }
    } catch (err) {
      console.error('Toggle wishlist error:', err);
      toast.error(
        err?.response?.data?.message
        || resolveMessage('messages.wishlistLoginRequired', 'Đăng nhập để quản lý danh sách yêu thích.'),
      );
    }
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
    if (!filtersInitialized) {
      return () => {};
    }
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
          isactive: true,
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

        const activeItems = (response.items || []).filter((item) => item.isActive !== false);
        setProducts(activeItems);
        setTotalPages(
          response.totalPages && response.totalPages > 0
            ? response.totalPages
            : Math.ceil((response.totalCount || activeItems.length) / pageSize),
        );
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || t('general.unknownError'));
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
  }, [filtersInitialized, pageIndex, pageSize, selectedCategory, searchQuery, sortOption, t]);

  useEffect(() => {
    if (userInfo) {
      refreshWishlist();
    } else {
      setWishlistMap(new Map());
    }
  }, [userInfo]);

  useEffect(() => {
    if (typeof window === 'undefined') return () => {};

    const handleStockUpdated = (event) => {
      const update = event?.detail || null;
      const updatedProductId = update?.productId;
      if (!updatedProductId) return;

      setProducts((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return prev;

        let touched = false;
        const next = prev
          .map((product) => {
            if (!product) return product;
            const productId = product.id ?? product.productId;
            if (String(productId) !== String(updatedProductId)) return product;
            touched = true;
            return {
              ...product,
              stock: typeof update.stock === 'number' ? update.stock : product.stock,
              isActive: typeof update.isActive === 'boolean' ? update.isActive : product.isActive,
            };
          })
          .filter((product) => product?.isActive !== false);

        return touched ? next : prev;
      });
    };

    window.addEventListener('realtime:productStockUpdated', handleStockUpdated);
    return () => {
      window.removeEventListener('realtime:productStockUpdated', handleStockUpdated);
    };
  }, []);

  return (
    <div className="bg-gradient-to-b from-[#FFFBF0] to-[#FFF8E7] min-h-screen">
      <Header />
      <ShopBanner
        onSelect={(label) => setSelectedCategory(label)}
        breadcrumbItems={breadcrumbItems}
      />

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
                    productId={product.id}
                    image={product.imageUrl || '/images/default-product.png'}
                    title={product.name}
                    shortDescription={product.shortDescription}
                    price={product.price}
                    rating={product.rating || 0}
                    stock={product.stock}
                    isWished={wishlistMap.has(product.id)}
                    onToggleWishlist={() => toggleWishlist(product.id)}
                    onAddToCart={() => handleAddToCart(product, product.price ?? 0)}
                    onBuyNow={() => handleBuyNow(product, product.price ?? 0)}
                    onClick={() => navigate(`/product-detail/${product.id}`, {
                      state: {
                        fromProductList: shopListNode,
                      },
                    })}
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
