import React, { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ProductService } from '../../services/modules/products/productService';

const CollectionCard = ({ image, title, shortDescription, price, loading }) => {
  return (
    <div className="flex flex-col gap-4 w-full max-w-[368px] bg-white rounded-xl shadow-md p-4">
      {loading ? (
        <Skeleton height={320} style={{ borderRadius: '0.75rem', marginBottom: '0.5rem' }} />
      ) : (
        <img 
          src={image} 
          alt={title}
          className="w-full h-[320px] object-cover rounded-xl mb-2" 
        />
      )}
      <div className="font-alata text-xl text-primary mb-1">
        {loading ? <Skeleton width={120} /> : title}
      </div>
      <div className="font-nunito text-base text-gray-700 mb-2">
        {loading ? <Skeleton count={2} /> : shortDescription}
      </div>
      <div className="font-nunito text-lg font-bold text-[#9e211f] mb-2">
        {loading ? <Skeleton width={80} /> : `Giá: ${price?.toLocaleString('vi-VN')}₫`}
      </div>
    </div>
  );
};

const Pagination = ({ totalPages, pageIndex, setPageIndex }) => {
  if (!totalPages || totalPages < 1) return null;

  // Tạo mảng số trang để hiển thị
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100"
        disabled={pageIndex === 1}
        onClick={() => setPageIndex(pageIndex - 1)}
      >
        &lt;
      </button>
      {pages.map((num) => (
        <button
          key={num}
          className={`w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 mx-1
            ${pageIndex === num ? 'bg-[#9e211f] text-white font-bold' : 'bg-white text-black hover:bg-gray-100'}`}
          onClick={() => setPageIndex(num)}
        >
          {num}
        </button>
      ))}
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100"
        disabled={pageIndex === totalPages}
        onClick={() => setPageIndex(pageIndex + 1)}
      >
        &gt;
      </button>
    </div>
  );
};

const Collections = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndexRaw] = useState(1);
  const [pageSize] = useState(3);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Khi chuyển trang, set loading true ngay lập tức
  const setPageIndex = (idx) => {
    setLoading(true);
    setPageIndexRaw(idx);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await ProductService.getAllProducts({ pageIndex, pageSize });
        setProducts(response.items || []);
        setTotalPages(
          response.totalPages && response.totalPages > 0
            ? response.totalPages
            : Math.ceil((response.totalCount || 0) / pageSize)
        );
        setTotalCount(response.totalCount || 0);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchProducts();
  }, [pageIndex, pageSize]);


  if (error) return <div>Error: {error}</div>;

  return (
    <section className="w-full py-12 md:py-20 lg:py-[106px] px-4 md:px-10 lg:px-36 bg-background">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="font-alata text-2xl md:text-3xl lg:text-4xl text-primary leading-tight lg:leading-[56px] mb-6 md:mb-10">
          Bộ sưu tập sản phẩm
        </h2>
        <div className="flex flex-col items-center gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full relative">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <CollectionCard key={idx} loading={true} />
              ))
            ) : products.length === 0 ? (
              <div className="col-span-3 text-center text-gray-500 py-10">Không có sản phẩm nào.</div>
            ) : (
              products.map((product) => (
                <CollectionCard
                  key={product.id}
                  image={product.imageUrl || '/default-product-image.jpg'}
                  title={product.name}
                  shortDescription={product.shortDescription}
                  price={product.price}
                  loading={false}
                />
              ))
            )}
          </div>
          <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={setPageIndex} />
        </div>
      </div>
    </section>
  );
};

export default Collections;
