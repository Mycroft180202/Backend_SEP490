import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../shared/ProductCard';
import Pagination from '../shared/Pagination';

const imgLine9 = "/images/Line9.png";
const imgVuesaxLinearCloseCircle = "/images/close-circle.png";
const imgHeart = "/images/heart-filled.png";
const imgCart = "/images/cart-icon.png";

const WishListGrid = ({ products = [], loading = false, onRemove, onAddToCart }) => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(1);
  const itemsPerPage = 12; // Changed to 12 items per page for better grid layout (3 rows x 4 cols)

  // Calculate pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (pageIndex - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);
  
  // Reset to page 1 when products change
  React.useEffect(() => {
    setPageIndex(1);
  }, [products.length]);

  const handleRemoveFromWishlist = (productId, e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(productId);
    }
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  if (!loading && products.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto px-8 py-12">
        <div className="text-center py-20">
          <div className="mb-6">
            <img 
              src={imgHeart} 
              alt="Empty wishlist" 
              className="w-24 h-24 mx-auto opacity-30"
              style={{ filter: 'grayscale(100%)' }}
            />
          </div>
          <h3 className="font-alata text-2xl text-gray-600 mb-4">
            Danh sách yêu thích trống
          </h3>
          <p className="font-nunito text-gray-500 mb-8">
            Bạn chưa có sản phẩm nào trong danh sách yêu thích
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-primary text-white font-nunito px-8 py-3 rounded-lg hover:bg-red-800 transition-colors"
          >
            Khám phá sản phẩm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-8 py-12">
      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <p className="font-nunito text-lg text-gray-600">
          Tìm thấy {products.length} sản phẩm
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => {
              products.forEach(product => {
                if (onAddToCart) onAddToCart(product);
              });
            }}
            className="bg-primary text-white font-nunito px-6 py-2 rounded-lg hover:bg-red-800 transition-colors flex items-center gap-2"
          >
            <img src={imgCart} alt="cart" className="w-5 h-5 filter invert" />
            Thêm tất cả vào giỏ
          </button>
        </div>
      </div>

      <div 
        style={{
          height: '1px',
          backgroundImage: `url(${imgLine9})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          margin: '16px 0',
        }}
      ></div>

      {/* Products Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {loading ? (
          Array.from({ length: 12 }).map((_, idx) => (
            <ProductCard key={idx} loading={true} />
          ))
        ) : (
          currentProducts.map((product) => (
            <div 
              key={product.id} 
              className="relative group cursor-pointer"
            >
              {/* Remove Button */}
              <button
                onClick={(e) => handleRemoveFromWishlist(product.id, e)}
                className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                title="Xóa khỏi danh sách yêu thích"
              >
                <img 
                  src={imgVuesaxLinearCloseCircle} 
                  alt="remove" 
                  className="w-6 h-6"
                />
              </button>

              {/* Product Card */}
              <div onClick={() => navigate(`/product-detail/${product.id}`)}>
                <ProductCard
                  image={product.imageUrl || '/default-product-image.jpg'}
                  title={product.name}
                  shortDescription={product.shortDescription}
                  price={product.price}
                  rating={product.rating || 0}
                  loading={false}
                />
              </div>

              {/* Add to Cart Button - Appears on Hover */}
              <button
                onClick={(e) => handleAddToCart(product, e)}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-white font-nunito px-6 py-2 rounded-lg hover:bg-red-800 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 whitespace-nowrap"
              >
                <img src={imgCart} alt="cart" className="w-5 h-5 filter invert" />
                Thêm vào giỏ
              </button>
            </div>
          ))
        )}
      </section>

      {/* Pagination - Always show at the bottom center */}
      {!loading && products.length > 0 && (
        <div className="flex justify-center mt-12 mb-8">
          <Pagination 
            totalPages={totalPages} 
            pageIndex={pageIndex} 
            setPageIndex={setPageIndex} 
          />
        </div>
      )}
    </div>
  );
};

export default WishListGrid;
