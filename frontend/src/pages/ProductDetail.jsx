import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import Breadcrumb from '../components/shared/Breadcrumb';
import ShortDescription from '../components/productDetail/ShortDescription';
import Detail from '../components/productDetail/Detail';
import RelationProduct from '../components/productDetail/RelationProduct';
import { ProductService } from '../services/modules/products/productService';
import { CategoryService } from '../services/modules/products/categoryService';
import StorytellingService from '../services/modules/products/storytellingService';
import { ShopService } from '../services/modules/shop/shopService';
import { NavigationKeys } from '../context/NavigationContext';
import useNavigationNode from '../hooks/useNavigationNode';
import useResolvedNavigationNode from '../hooks/useResolvedNavigationNode';

const PromoCard = ({
  title, image, href, badge, state,
}) => (
  <Link
    to={href || '#'}
    state={state}
    className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B4513]/40"
    aria-label={title || 'Khám phá câu chuyện thủ công'}
  >
    <article className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white/95 shadow-[0_12px_30px_-18px_rgba(122,9,9,0.35)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_20px_40px_-24px_rgba(122,9,9,0.55)] flex flex-col min-h-[260px]">
      <div className="relative h-[150px] flex-none overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45 transition-opacity duration-300 group-hover:opacity-70" />
        {badge && (
          <span className="absolute left-4 bottom-4 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#7A0909] shadow-sm">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-[1] flex-col gap-3 px-5 py-4">
        <h3 className="font-alata text-base leading-snug text-[#7A0909] transition-colors duration-300 group-hover:text-[#B73E3E]">
          {title}
        </h3>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-[#7A0909] transition-colors duration-300 group-hover:text-[#B73E3E]">
            Khám phá thêm
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-[#7A0909] transition-all duration-300 group-hover:translate-x-1 group-hover:border-[#B73E3E] group-hover:text-[#B73E3E]">
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 8h10m-4-4 4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-200 via-amber-300 to-[#B73E3E] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </article>
  </Link>
);

const GalleryCard = ({ image, isActive, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative w-full aspect-square overflow-hidden rounded-xl border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B4513]/40 ${
      isActive
        ? 'border-amber-400 shadow-lg ring-2 ring-[#8B4513]/30'
        : 'border-amber-200 bg-white/80 hover:border-amber-300 hover:-translate-y-0.5'
    }`}
    aria-label={label}
  >
    <img
      src={image}
      alt={label}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
    />
    {isActive && (
      <span className="absolute inset-x-0 bottom-0 bg-[#8B4513]/80 text-white text-xs font-semibold tracking-wide uppercase text-center py-1">
        Đang xem
      </span>
    )}
  </button>
);

const storyTypeBadges = {
  ProductStory: 'Câu chuyện sản phẩm',
  CraftingProcess: 'Quy trình chế tác',
  ArtisanBiography: 'Câu chuyện Nghệ nhân',
};

const DEFAULT_STORY_IMAGE = 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=500&q=80';

const toPlainText = (value) => {
  if (!value) return '';
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const mergeShopInfo = (base, extra) => {
  if (!extra) return base || null;
  const result = { ...(base || {}) };
  Object.entries(extra).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    result[key] = value;
  });
  return Object.keys(result).length ? result : null;
};

const normalizeShopInfo = (source) => {
  if (!source) return null;
  const raw = source?.shop || source?.data || source;
  if (!raw) return null;
  const artisanId = raw.artisanId
    || raw.artisanID
    || raw.userId
    || raw.userID
    || null;
  const image = raw.shopUrlImage
    || raw.shopURLImage
    || raw.userUrlImage
    || raw.userURLImage
    || raw.avatarUrl
    || raw.avatar
    || raw.image
    || null;
  const name = raw.shopName
    || raw.displayName
    || raw.name
    || raw.artisanName
    || null;
  return {
    artisanId,
    name,
    image,
    phone: raw.phoneNumber || raw.phone || null,
    address: raw.address || raw.location || null,
    author: raw.displayName || raw.ownerName || null,
  };
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storyPromos, setStoryPromos] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [shopInfo, setShopInfo] = useState(null);
  const promoCards = useMemo(() => storyPromos.slice(0, 3), [storyPromos]);
  const productListNode = useResolvedNavigationNode({
    locationKey: 'fromProductList',
    contextKey: NavigationKeys.LAST_PRODUCT_LIST,
  });
  const collectionNode = useResolvedNavigationNode({
    locationKey: 'fromCollection',
    contextKey: NavigationKeys.LAST_COLLECTION,
  });
  const profileNavigationNode = useResolvedNavigationNode({
    locationKey: 'fromProfile',
  });

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'Trang chủ', href: '/' }];
    if (profileNavigationNode?.label && profileNavigationNode?.href) {
      items.push({
        label: profileNavigationNode.label,
        href: profileNavigationNode.href,
        state: profileNavigationNode.state,
      });
    }
    const productCrumbLabel = product?.name || 'Chi tiết sản phẩm';
    if (collectionNode?.label && collectionNode?.href) {
      items.push({
        label: collectionNode.label,
        href: collectionNode.href,
        state: { fromCollection: collectionNode },
      });
    }
    if (productListNode?.label && productListNode?.href) {
      items.push({
        label: productListNode.label,
        href: productListNode.href,
        state: { fromProductList: productListNode },
      });
    }
    if (!collectionNode?.href && !productListNode?.href) {
      items.push({ label: 'Cửa hàng', href: '/shop' });
    }
    items.push({ label: productCrumbLabel });
    return items;
  }, [collectionNode, product?.name, productListNode, profileNavigationNode]);
  const productNavigationNode = useMemo(() => {
    if (!product?.id) {
      return null;
    }
    return {
      label: product.name || 'Chi tiết sản phẩm',
      href: `/product-detail/${product.id}`,
    };
  }, [product?.id, product?.name]);

  useNavigationNode(NavigationKeys.LAST_PRODUCT, productNavigationNode);

  const productImages = useMemo(() => {
    if (Array.isArray(product?.images) && product.images.length) {
      return product.images;
    }
    return ['/images/default-product.png'];
  }, [product]);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        setShopInfo(null);
        const response = await ProductService.getProductById(id);
        setProduct(response);
        setShopInfo((prev) => mergeShopInfo(prev, normalizeShopInfo(response)));
        
        // Fetch category name
        if (response.category) {
          try {
            const categories = await CategoryService.getAllCategories();
            const category = categories.find(cat => cat.id === response.category);
            if (category) {
              setCategoryName(category.name);
            }
          } catch (catError) {
            console.error('Error fetching category:', catError);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetail();
    }
  }, [id]);

  useEffect(() => {
    const loadStories = async () => {
      if (!product?.id && !product?.productId) return;
      try {
        const data = await StorytellingService.getStoriesByProduct(product.id || product.productId);
        if (Array.isArray(data) && data.length) {
          const normalized = data.slice(0, 3).map((item) => ({
            id: item.id,
            title: item.title || 'Story highlight',
            excerpt: toPlainText(item.content) || 'Khám phá câu chuyện thủ công độc đáo.',
            image: item.image || DEFAULT_STORY_IMAGE,
            href: `/storytelling/${item.id}`,
            state: product?.id
              ? {
                fromProduct: {
                  label: product.name || 'Chi tiết sản phẩm',
                  href: `/product-detail/${product.id}`,
                },
                ...(productListNode?.label && productListNode?.href
                  ? { fromProductList: productListNode }
                  : {}),
              }
              : undefined,
            badge: storyTypeBadges[item.storyType] || 'Story',
          }));
          setStoryPromos(normalized);
        } else {
          setStoryPromos([]);
        }
      } catch (storyError) {
        console.error('Không thể tải story telling:', storyError);
        setStoryPromos([]);
      }
    };

    loadStories();
  }, [product?.id, product?.productId, product?.name, productListNode]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?.id, product?.productId]);

  useEffect(() => {
    const artisanId = product?.artisanId || product?.artisanID;
    if (!artisanId) return;
    let canceled = false;

    const ensureShopInfo = async () => {
      if (shopInfo?.image && shopInfo?.artisanId === artisanId) {
        return;
      }
      try {
        const data = await ShopService.getShopByUserId(artisanId);
        if (canceled) return;
        setShopInfo((prev) => mergeShopInfo(prev, normalizeShopInfo(data)));
      } catch (shopError) {
        console.error('Không thể tải thông tin cửa hàng:', shopError);
      }
    };

    ensureShopInfo();

    return () => {
      canceled = true;
    };
  }, [product?.artisanId, product?.artisanID, shopInfo?.image, shopInfo?.artisanId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="relative bg-[#fff4e5]">
          <div className="px-4 sm:px-8 lg:px-12 py-4">
            <Breadcrumb items={breadcrumbItems} floating />
          </div>
        </div>
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="relative bg-[#fff4e5]">
          <div className="px-4 sm:px-8 lg:px-12 py-4">
            <Breadcrumb items={breadcrumbItems} floating />
          </div>
        </div>
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center text-red-600">
            <p className="text-xl mb-2">Lỗi: {error}</p>
            <p>Không thể tải thông tin sản phẩm</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="relative bg-[#fff4e5]">
          <div className="px-4 sm:px-8 lg:px-12 py-4">
            <Breadcrumb items={breadcrumbItems} floating />
          </div>
        </div>
        <main className="flex-grow flex items-center justify-center">
          <p className="text-gray-600">Không tìm thấy sản phẩm</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Header />
      <div className="relative bg-[#fff4e5]">
        <div className="px-4 sm:px-8 lg:px-12 py-6">
          <Breadcrumb items={breadcrumbItems} floating />
        </div>
      </div>
      <main className="flex-grow">
        <div className="px-4 sm:px-8 lg:px-12 py-8">
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
            <div className="hidden lg:flex justify-center mt-8 self-start">
              <div className="w-full max-w-[280px]">
                <div className="flex max-h-[680px] flex-col gap-3 overflow-y-auto pr-1">
                  {productImages.map((img, idx) => (
                    <GalleryCard
                      key={`gallery-${idx}-${img}`}
                      image={img}
                      label={`Ảnh ${idx + 1}`}
                      isActive={idx === selectedImageIndex}
                      onClick={() => setSelectedImageIndex(idx)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <ShortDescription
                product={product}
                selectedImageIndex={selectedImageIndex}
                onSelectImage={setSelectedImageIndex}
                shopInfo={shopInfo}
              />
              <Detail
                product={product}
                categoryName={categoryName}
                shopInfo={shopInfo}
              />
              <RelationProduct categoryId={product.category} currentProductId={product.id} />
            </div>
            <div className="hidden lg:flex flex-col gap-6 self-start mt-8">
              {promoCards.map((promo) => (
                <PromoCard key={`promo-${promo.id || promo.title}`} {...promo} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
