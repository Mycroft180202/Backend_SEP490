import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';
import Pagination from '../shared/Pagination';
import { ProductCollectionService } from '../../services/modules/collections/productCollectionService';
import { SECTION_TITLE_CLASS, SECTION_SUBTITLE_CLASS } from '../../utils/homeTheme';

const Collections = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 3;

  useEffect(() => {
    let isMounted = true;
    const fetchCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await ProductCollectionService.list();
        if (!isMounted) return;
        setCollections(res || []);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || 'Không thể tải bộ sưu tập');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCollections();
    return () => { isMounted = false; };
  }, []);

  const activeCollections = collections.filter((item) => item.isActive !== false);
  const totalPages = Math.max(1, Math.ceil(activeCollections.length / pageSize));
  const displayed = activeCollections.slice((pageIndex - 1) * pageSize, (pageIndex - 1) * pageSize + pageSize);

  return (
    <section className="relative pt-20 md:pt-24 pb-16 md:pb-24 bg-[#FFF6E9] -mt-px">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 text-[#8B4513] text-xs font-semibold uppercase tracking-[0.2em]">
              Bộ sưu tập
            </span>
            <h2 className={SECTION_TITLE_CLASS}>
              Bộ sưu tập sản phẩm
            </h2>
            <p className={`${SECTION_SUBTITLE_CLASS} max-w-2xl`}>
              Khám phá những bộ sưu tập được tuyển chọn kỹ lưỡng, nơi mỗi thiết kế đều mang dấu ấn của làng nghề Hòa Lạc.
            </p>
          </div>
          {activeCollections.length > pageSize && (
            <div className="hidden md:block md:pb-1">
              <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={setPageIndex} />
            </div>
          )}
        </div>

        {error && (
          <div className="text-center text-red-600 mb-6">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-72 md:h-80 bg-white/70 rounded-3xl shadow animate-pulse" />
            ))
          ) : collections.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500 py-20 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">:/</div>
              <p className="text-xl font-['Nunito']">{t('home.collections.empty')}</p>
            </div>
          ) : (
            displayed.map((item) => (
                <button
                  key={item.productCollectionId || item.id}
                  type="button"
                  onClick={() => navigate(`/collections/${item.productCollectionId || item.id}`)}
                  className="relative group flex flex-col rounded-3xl overflow-hidden shadow-lg border border-[#D4A574]/40 bg-white transition-transform duration-500 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="h-72 md:h-80 overflow-hidden">
                    <img
                      src={item.image || '/images/default-product.png'}
                      alt={item.title}
                      className="w-full h-full object-cover transition duration-700 ease-out group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                    <h3 className="text-2xl font-semibold text-white drop-shadow-lg">
                      {item.title}
                    </h3>
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white/85 text-[#8B4513] rounded-full text-sm font-semibold shadow-sm backdrop-blur-sm transition-transform duration-500 group-hover:translate-y-[-2px]">
                      Khám phá ngay
                      <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </button>
              ))
          )}
        </div>
        {activeCollections.length > pageSize && (
          <div className="mt-10 flex justify-center md:hidden">
            <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={setPageIndex} />
          </div>
        )}
      </div>
    </section>
  );
};

export default Collections;
