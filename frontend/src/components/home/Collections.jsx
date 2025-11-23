import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';
import Pagination from '../shared/Pagination';
import { ProductCollectionService } from '../../services/modules/collections/productCollectionService';

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
    <section className="py-16 bg-gradient-to-b from-[#FFF8E7] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="font-alata text-3xl lg:text-4xl text-[#8B4513]">Bộ sưu tập sản phẩm</h2>
          </div>
        </div>

        {error && (
          <div className="text-center text-red-600 mb-6">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-72 bg-white rounded-2xl shadow animate-pulse" />
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
                  className="relative group rounded-2xl overflow-hidden shadow-lg border border-[#D4A574]/50 bg-white"
                >
                  <div className="h-72 overflow-hidden">
                    <img
                      src={item.image || '/images/default-product.png'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
                    <p className="text-sm text-[#D32F2F] uppercase tracking-wide mb-1">Bộ sưu tập</p>
                    <h3 className="text-2xl font-bold text-white drop-shadow">{item.title}</h3>
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-white/80 text-[#D32F2F] rounded-full text-sm font-semibold shadow">
                      Khám phá ngay →
                    </div>
                  </div>
                </button>
              ))
          )}
        </div>
        {activeCollections.length > pageSize && (
          <div className="mt-8">
            <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={setPageIndex} />
          </div>
        )}
      </div>
    </section>
  );
};

export default Collections;
