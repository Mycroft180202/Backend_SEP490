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

const promoHighlights = [
  {
    id: 'promo-heritage',
    title: 'Tinh hoa nghề gốm Hòa Lạc',
    excerpt: 'Theo chân nghệ nhân để thấy từng đường nét được tạo nên từ đôi tay khéo léo và sự kiên nhẫn vô tận.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80',
    href: '/blog',
    badge: 'Blog thủ công',
  },
  {
    id: 'promo-workshop',
    title: 'Workshop cuối tuần',
    excerpt: 'Trải nghiệm đan mây tre, học cách thổi hồn vào chất liệu tự nhiên cùng các nghệ nhân kỳ cựu.',
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=500&q=80',
    href: '/contact',
    badge: 'Trải nghiệm',
  },
  {
    id: 'promo-custom',
    title: 'Thiết kế riêng theo yêu cầu',
    excerpt: 'Đặt những món quà độc bản được làm thủ công, phù hợp cho không gian và câu chuyện của bạn.',
    image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=500&q=80',
    href: '/shop',
    badge: 'Đặt riêng',
  },
  {
    id: 'promo-fair',
    title: 'Phiên chợ thủ công',
    excerpt: 'Gặp gỡ cộng đồng nghệ nhân địa phương và cập nhật những bộ sưu tập mới nhất trong tháng.',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=500&q=80',
    href: '/about',
    badge: 'Sự kiện',
  },
];

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
        to={href}
        className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[#7A0909] hover:text-[#B73E3E] transition-colors"
      >
        Khám phá thêm
        <span aria-hidden>→</span>
      </Link>
    </div>
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const breadcrumbItems = useMemo(() => ([
    { label: 'Trang chủ', href: '/' },
    { label: 'Cửa hàng', href: '/shop' },
    { label: product?.name || 'Chi tiết sản phẩm' },
  ]), [product]);

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
            <div className="hidden lg:flex flex-col gap-6 sticky top-24 self-start">
              {promoHighlights.slice(0, 2).map((promo) => (
                <PromoCard key={promo.id} {...promo} />
              ))}
            </div>
            <div className="space-y-8">
              <ShortDescription product={product} />
              <Detail product={product} categoryName={categoryName} />
              <RelationProduct categoryId={product.category} currentProductId={product.id} />
            </div>
            <div className="hidden lg:flex flex-col gap-6 sticky top-24 self-start">
              {promoHighlights.slice(2).map((promo) => (
                <PromoCard key={promo.id} {...promo} />
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
