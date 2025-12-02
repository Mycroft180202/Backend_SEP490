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

const PromoCard = ({
  title, excerpt, image, href, badge,
}) => (
  <div className="bg-white/90 rounded-2xl overflow-hidden border border-amber-200 shadow-[0_12px_30px_-18px_rgba(122,9,9,0.4)] flex flex-col h-[280px]">
    <div className="h-28 overflow-hidden">
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
    </div>
    <div className="p-4 flex flex-col gap-3 flex-1">
      {badge && (
        <span className="inline-flex items-center px-3 py-1 text-xs tracking-[0.2em] uppercase text-[#7A0909] bg-amber-50 border border-amber-200 rounded-full font-semibold">
          {badge}
        </span>
      )}
      <h3 className="font-alata text-lg text-[#7A0909] leading-tight line-clamp-2">{title}</h3>
      <p className="text-sm text-gray-600 line-clamp-3">{excerpt}</p>
      <Link
        to={href || '#'}
        className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[#7A0909] hover:text-[#B73E3E] transition-colors"
      >
        Khám phá thêm
        <span aria-hidden>→</span>
      </Link>
    </div>
  </div>
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

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storyPromos, setStoryPromos] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const promoCards = useMemo(() => storyPromos.slice(0, 3), [storyPromos]);

  const breadcrumbItems = useMemo(() => ([
    { label: 'Trang chủ', href: '/' },
    { label: 'Cửa hàng', href: '/shop' },
    { label: product?.name || 'Chi tiết sản phẩm' },
  ]), [product]);

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
        const response = await ProductService.getProductById(id);
        setProduct(response);
        
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
  }, [product?.id, product?.productId]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?.id, product?.productId]);

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
            <div className="hidden lg:flex justify-center top-24 self-start">
              <div className="w-[150px]">
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
              />
              <Detail product={product} categoryName={categoryName} />
              <RelationProduct categoryId={product.category} currentProductId={product.id} />
            </div>
            <div className="hidden lg:flex flex-col gap-6 self-start">
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
