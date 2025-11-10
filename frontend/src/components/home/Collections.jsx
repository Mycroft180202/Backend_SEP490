import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductService } from '../../services/modules/products/productService';
import ProductCard from '../shared/ProductCard';
import Pagination from '../shared/Pagination';
import { LanguageContext } from '../../context/LanguageContext';

const Collections = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 3;
  const [totalPages, setTotalPages] = useState(0);
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        if (!isMounted) {
          return;
        }
        setLoading(true);
        setError(null);

        const response = await ProductService.getAllProducts({ pageIndex, pageSize });
        if (!isMounted) {
          return;
        }

        setProducts(response.items || []);
        setTotalPages(
          response.totalPages && response.totalPages > 0
            ? response.totalPages
            : Math.ceil((response.totalCount || 0) / pageSize),
        );
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err?.message || 'Không thể tải bộ sưu tập');
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
  }, [pageIndex, pageSize]);

  const handleSetPageIndex = (nextIndex) => {
    setLoading(true);
    setPageIndex(nextIndex);
  };

  if (error) {
    return (
      <section className="w-full py-20 text-center bg-[#FFFBF0]">
        <p className="text-red-600 text-lg">{`${t('general.errorPrefix')}${error}`}</p>
      </section>
    );
  }

  return (
    <section className="w-full py-12 md:py-20 lg:py-[106px] px-4 md:px-10 lg:px-36 bg-gradient-to-b from-[#FFFBF0] to-white">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px bg-gradient-to-r from-transparent via-[#D4A574] to-[#D4A574] w-20" />
            <div className="w-3 h-3 bg-[#9e211f] rotate-45" />
            <h2 className="font-['Nunito'] text-3xl md:text-4xl lg:text-5xl text-[#9e211f] font-bold px-4">
              {t('home.collections.title')}
            </h2>
            <div className="w-3 h-3 bg-[#9e211f] rotate-45" />
            <div className="h-px bg-gradient-to-l from-transparent via-[#D4A574] to-[#D4A574] w-20" />
          </div>
          <p className="font-['Nunito'] text-gray-600 text-lg">
            {t('home.collections.description')}
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {loading ? (
              Array.from({ length: pageSize }).map((_, idx) => <ProductCard key={idx} loading />)
            ) : products.length === 0 ? (
              <div className="col-span-3 text-center text-gray-500 py-20 bg-white rounded-2xl shadow-lg">
                <div className="text-6xl mb-4">:/</div>
                <p className="text-xl font-['Nunito']">{t('home.collections.empty')}</p>
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
                  onClick={() => navigate(`/product-detail/${product.id}`)}
                />
              ))
            )}
          </div>
          <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={handleSetPageIndex} />
        </div>
      </div>
    </section>
  );
};

export default Collections;
