import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from '../shared/ProductCard';
import Pagination from '../shared/Pagination';
import { ProductService } from '../../services/modules/products/productService';
import { SECTION_TITLE_CLASS, SECTION_SUBTITLE_CLASS, PRIMARY_BUTTON_CLASS } from '../../utils/homeTheme';

const PAGE_SIZE = 4;

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await ProductService.getAllProducts({ pageIndex: 1, pageSize: 50, isactive: true });
        const items = (res?.items || []).filter((item) => item.isActive !== false);
        const sorted = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setProducts(sorted);
      } catch (err) {
        console.error('Load featured products error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const display = useMemo(
    () => products.slice((pageIndex - 1) * PAGE_SIZE, (pageIndex - 1) * PAGE_SIZE + PAGE_SIZE),
    [products, pageIndex],
  );

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF6E9] via-[#FFFDF7] to-[#FBF1DE] pt-20 pb-24">
      <div className="absolute inset-x-0 top-0 -translate-y-full pointer-events-none">
        <svg className="w-full h-16 md:h-20" viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 120 Q60 0 120 120 T240 120 T360 120 T480 120 T600 120 T720 120 T840 120 T960 120 T1080 120 T1200 120 T1320 120 T1440 120 L1440 0 L0 0 Z" fill="#FFF6E9" />
        </svg>
      </div>
      <div className="absolute inset-x-0 bottom-0 translate-y-[1px] pointer-events-none">
        <svg className="w-full h-16 md:h-20" viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 0 Q60 120 120 0 T240 0 T360 0 T480 0 T600 0 T720 0 T840 0 T960 0 T1080 0 T1200 0 T1320 0 T1440 0 L1440 120 L0 120 Z" fill="#FFF3E0" />
        </svg>
      </div>
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, #C19A5B 0, transparent 45%), radial-gradient(circle at 85% 10%, #B96C5E 0, transparent 40%), radial-gradient(circle at 40% 80%, #C48D5E 0, transparent 45%)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-4 md:px-10 lg:px-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 text-[#8B4513] text-xs font-semibold uppercase tracking-[0.25em]">
              Tinh hoa chọn lọc
            </span>
            <div>
              <h2 className={SECTION_TITLE_CLASS}>Sản phẩm nổi bật</h2>
              <p className={`mt-3 ${SECTION_SUBTITLE_CLASS} max-w-2xl`}>
                Những tác phẩm thủ công được yêu thích nhất, hội tụ sự tỉ mỉ của người nghệ nhân Hòa Lạc và chất liệu truyền thống.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.location.assign('/shop')}
            className={`${PRIMARY_BUTTON_CLASS} self-start md:self-end`}
          >
            Xem cửa hàng
            <span aria-hidden className="text-lg">→</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 w-full">
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, idx) => <ProductCard key={idx} loading />)
              : display.map((product) => (
                <div
                  key={product.id}
                  className="rounded-3xl bg-white/80 border border-[#D4A574]/30 shadow-[0_18px_40px_-28px_rgba(97,43,0,0.55)] transition-transform duration-500 hover:-translate-y-1 hover:shadow-[0_22px_45px_-24px_rgba(97,43,0,0.65)]"
                >
                  <ProductCard
                    variant="grid"
                    productId={product.id}
                    image={product.imageUrl || '/images/default-product.png'}
                    title={product.name}
                    price={product.price}
                    rating={product.rating || 0}
                    stock={product.stock}
                    shopName={product.displayName || product.shopName}
                    shortDescription={product.shortDescription}
                    onClick={() => window.location.assign(`/product-detail/${product.id}`)}
                  />
                </div>
              ))}
          </div>

          {products.length > PAGE_SIZE && (
            <div className="w-full flex justify-center">
              <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={setPageIndex} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
