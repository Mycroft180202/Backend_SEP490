import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart } from 'react-icons/fa';
import { ProductService } from '../../services/modules/products/productService';

const CollectionCard = ({ product, loading, navigate }) => {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-500" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-500" />);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-500" />);
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <Skeleton height={280} />
        <div className="p-4">
          <Skeleton height={24} className="mb-2" />
          <Skeleton count={2} className="mb-3" />
          <Skeleton height={20} width={100} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group bg-white rounded-xl overflow-hidden border border-[#D4A574]/30 hover:border-[#D4A574] transition-all duration-300 hover:shadow-xl cursor-pointer"
      onClick={() => navigate(`/product-detail/${product.id}`)}
    >
      {/* Product Image */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#FFF8E7] to-white">
        <img
          src={product.imageUrl || '/images/default-product.png'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Product Info */}
      <div className="p-4 bg-gradient-to-b from-white to-[#FFFBF0]">
        {/* Product Name */}
        <h3 className="font-['Nunito'] text-lg font-semibold text-[#8B4513] mb-2 line-clamp-2 group-hover:text-[#D4A574] transition min-h-[56px]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {renderStars(product.rating || 0)}
          <span className="text-sm text-gray-600 ml-1">
            ({product.rating?.toFixed(1) || '0.0'})
          </span>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-2 border-t border-[#D4A574]/20">
          <span className="text-xl font-bold text-[#8B4513] font-['Nunito']">
            {product.price?.toLocaleString('vi-VN')}đ
          </span>
          <button 
            className="bg-[#8B4513] text-white p-2 rounded-lg hover:bg-[#D4A574] transition"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Add to cart functionality
            }}
          >
            <FaShoppingCart className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Pagination = ({ totalPages, pageIndex, setPageIndex }) => {
  if (!totalPages || totalPages < 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-3 mt-10">
      <button
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-[#D4A574] text-[#9e211f] hover:bg-[#9e211f] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md font-semibold"
        disabled={pageIndex === 1}
        onClick={() => setPageIndex(pageIndex - 1)}
      >
        ‹
      </button>
      {pages.map((num) => (
        <button
          key={num}
          className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300 shadow-md font-semibold
            ${pageIndex === num 
              ? 'bg-[#9e211f] border-[#9e211f] text-white scale-110' 
              : 'bg-white border-[#D4A574] text-gray-700 hover:bg-[#FFF8E7] hover:border-[#9e211f]'
            }`}
          onClick={() => setPageIndex(num)}
        >
          {num}
        </button>
      ))}
      <button
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-[#D4A574] text-[#9e211f] hover:bg-[#9e211f] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md font-semibold"
        disabled={pageIndex === totalPages}
        onClick={() => setPageIndex(pageIndex + 1)}
      >
        ›
      </button>
    </div>
  );
};

const Collections = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndexRaw] = useState(1);
  const [pageSize] = useState(3);
  const [totalPages, setTotalPages] = useState(0);

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
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchProducts();
  }, [pageIndex, pageSize]);


  if (error) return (
    <div className="w-full py-20 text-center">
      <div className="text-red-600 text-lg">Lỗi: {error}</div>
    </div>
  );

  return (
    <section className="w-full py-12 md:py-20 lg:py-[106px] px-4 md:px-10 lg:px-36 bg-gradient-to-b from-[#FFFBF0] to-white">
      <div className="max-w-[1440px] mx-auto">
        {/* Title with traditional decoration */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px bg-gradient-to-r from-transparent via-[#D4A574] to-[#D4A574] w-20"></div>
            <div className="w-3 h-3 bg-[#9e211f] rotate-45"></div>
            <h2 className="font-['Nunito'] text-3xl md:text-4xl lg:text-5xl text-[#9e211f] font-bold px-4">
              Bộ sưu tập sản phẩm
            </h2>
            <div className="w-3 h-3 bg-[#9e211f] rotate-45"></div>
            <div className="h-px bg-gradient-to-l from-transparent via-[#D4A574] to-[#D4A574] w-20"></div>
          </div>
          <p className="font-['Nunito'] text-gray-600 text-lg">
            Khám phá những sản phẩm thủ công mỹ nghệ truyền thống Việt Nam
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <CollectionCard key={idx} loading={true} />
              ))
            ) : products.length === 0 ? (
              <div className="col-span-3 text-center text-gray-500 py-20 bg-white rounded-2xl shadow-lg">
                <div className="text-6xl mb-4">🏺</div>
                <p className="text-xl font-['Nunito']">Không có sản phẩm nào.</p>
              </div>
            ) : (
              products.map((product) => (
                <CollectionCard
                  key={product.id}
                  product={product}
                  loading={false}
                  navigate={navigate}
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
