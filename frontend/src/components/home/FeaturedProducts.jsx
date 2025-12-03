import React, { useContext, useEffect, useMemo, useState } from 'react';
import ProductCard from '../shared/ProductCard';
import Pagination from '../shared/Pagination';
import { ProductService } from '../../services/modules/products/productService';
import { SECTION_TITLE_CLASS, SECTION_SUBTITLE_CLASS, PRIMARY_BUTTON_CLASS } from '../../utils/homeTheme';
import { LanguageContext } from '../../context/LanguageContext';

const PAGE_SIZE = 4;

const FeaturedProducts = () => {
  const { t } = useContext(LanguageContext);
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
    <section className="relative overflow-hidden bg-[#FFF6E9] pt-20 pb-24">
      <div className="relative max-w-[1440px] mx-auto px-4 md:px-10 lg:px-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 text-[#8B4513] text-xs font-semibold uppercase tracking-[0.25em]">
              {t('home.featured.badge')}
            </span>
            <div>
              <h2 className={SECTION_TITLE_CLASS}>{t('home.featured.title')}</h2>
              <p className={`mt-3 ${SECTION_SUBTITLE_CLASS} max-w-2xl`}>
                {t('home.featured.description')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.location.assign('/shop')}
            className={`${PRIMARY_BUTTON_CLASS} self-start md:self-end`}
          >
            {t('home.featured.cta')}
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
