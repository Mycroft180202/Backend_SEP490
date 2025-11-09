import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ProductService } from '../../services/modules/products/productService';

const RelationProduct = ({ categoryId, currentProductId }) => {
  const navigate = useNavigate();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 4;

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        const response = await ProductService.getAllProducts({
          CategoryId: categoryId,
          PageSize: 20,
        });
        
        // Lọc bỏ sản phẩm hiện tại
        const filtered = response.items.filter(p => p.id !== currentProductId);
        setRelatedProducts(filtered);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching related products:', err);
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchRelatedProducts();
    }
  }, [categoryId, currentProductId]);

  const totalPages = Math.ceil(relatedProducts.length / productsPerPage);
  const currentProducts = relatedProducts.slice(
    currentPage * productsPerPage,
    (currentPage + 1) * productsPerPage
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleProductClick = (productId) => {
    navigate(`/product-detail/${productId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}
        size={14}
      />
    ));
  };

  if (loading) {
    return (
      <div className="w-full bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-500">Đang tải sản phẩm liên quan...</p>
        </div>
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-b from-white to-[#FFF8E7] py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header với style truyền thống */}
        <div className="text-center mb-12">
          <div className="inline-block">
            <h2 className="text-4xl font-bold text-[#8B4513] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              Sản phẩm tương tự
            </h2>
            <div className="h-1 bg-gradient-to-r from-transparent via-[#D4A574] to-transparent rounded"></div>
          </div>
          <p className="text-gray-600 mt-4">Khám phá thêm các sản phẩm mỹ nghệ truyền thống</p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {currentProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-[#D4A574]"
            >
              {/* Product Image */}
              <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#FFF8E7] to-white rounded-t-2xl">
                <img
                  src={product.imageUrl || '/images/default-product.png'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Badge giá */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  {product.price.toLocaleString('vi-VN')}₫
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 space-y-3">
                {/* Product Name */}
                <h3 className="text-lg font-semibold text-[#8B4513] line-clamp-2 group-hover:text-[#D4A574] transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {product.name}
                </h3>

                {/* Shop Name */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B4513] flex items-center justify-center text-white text-xs font-bold">
                    {product.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{product.displayName}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(product.rating || 0)}</div>
                  <span className="text-sm text-gray-600">({product.rating || 0})</span>
                </div>

                {/* Stock */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-500">Còn {product.stock} sản phẩm</span>
                  <span className="text-[#8B4513] font-semibold group-hover:text-[#D4A574]">Xem chi tiết →</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination với style đẹp */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="p-3 rounded-full bg-white border-2 border-[#D4A574] text-[#8B4513] hover:bg-[#D4A574] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <FaChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`w-10 h-10 rounded-full font-bold transition-all shadow-md ${
                    currentPage === index
                      ? 'bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white scale-110'
                      : 'bg-white border-2 border-[#D4A574] text-[#8B4513] hover:bg-[#D4A574] hover:text-white'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="p-3 rounded-full bg-white border-2 border-[#D4A574] text-[#8B4513] hover:bg-[#D4A574] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <FaChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationProduct;
