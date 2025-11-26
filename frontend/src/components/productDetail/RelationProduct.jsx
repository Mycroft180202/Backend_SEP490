import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ProductService } from '../../services/modules/products/productService';
import ProductCard from '../shared/ProductCard';
import { LanguageContext } from '../../context/LanguageContext';

const RelationProduct = ({ categoryId, currentProductId }) => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 4;

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        const response = await ProductService.getAllProducts({
          categoryId,
          pageSize: 20,
          pageIndex: 1,
        });
        
        // Lọc bỏ sản phẩm hiện tại
        const filtered = (response.items || []).filter(p => p.id !== currentProductId);
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

  if (loading) {
    return (
      <div className="w-full bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-500">{t('relation.loading')}</p>
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
            <h2 className="text-4xl font-bold text-[#8B4513] mb-3">
              {t('relation.title')}
            </h2>
            <div className="h-1 bg-gradient-to-r from-transparent via-[#D4A574] to-transparent rounded"></div>
          </div>
          <p className="text-gray-600 mt-4">{t('relation.subtitle')}</p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {currentProducts.map((product) => (
            <ProductCard
              key={product.id}
              variant="related"
              productId={product.id}
              image={product.imageUrl || '/images/default-product.png'}
              title={product.name}
              price={product.price}
              rating={product.rating || 0}
              shopName={product.displayName}
              stock={product.stock}
              onClick={() => handleProductClick(product.id)}
            />
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
