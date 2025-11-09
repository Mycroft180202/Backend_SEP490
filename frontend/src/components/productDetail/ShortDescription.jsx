import React, { useState } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar, FaHeart, FaRegHeart, FaShare, FaChevronLeft, FaChevronRight, FaShoppingCart, FaStore, FaBoxOpen } from 'react-icons/fa';

const ShortDescription = ({ product }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [thumbnailStart, setThumbnailStart] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!product) return null;

  // Lấy ảnh chính (ảnh đầu tiên) hoặc ảnh mặc định
  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['/images/default-product.png'];

  const mainImage = images[selectedImage] || images[0];
  const thumbnailsPerPage = 4;
  const maxThumbnailStart = Math.max(0, images.length - thumbnailsPerPage);

  // Render stars dựa trên rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }
    return stars;
  };

  const handleQuantityChange = (type) => {
    if (type === 'increase' && quantity < product.stock) {
      setQuantity(quantity + 1);
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', { productId: product.id, quantity });
  };

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrevThumbnail = () => {
    setThumbnailStart((prev) => Math.max(0, prev - thumbnailsPerPage));
  };

  const handleNextThumbnail = () => {
    setThumbnailStart((prev) => Math.min(maxThumbnailStart, prev + thumbnailsPerPage));
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="w-full py-10 bg-gradient-to-b from-[#FFF8E7] to-[#FFFDEB]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left - Images */}
          <div className="space-y-4">
            {/* Main Image với khung trang trí */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-xl border-4 border-[#D4A574]">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5"></div>
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation Arrows với style truyền thống */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-3 hover:bg-[#D4A574] hover:text-white transition-all duration-300 border-2 border-[#D4A574]"
                    aria-label="Ảnh trước"
                  >
                    <span className="text-xl">‹</span>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-3 hover:bg-[#D4A574] hover:text-white transition-all duration-300 border-2 border-[#D4A574]"
                    aria-label="Ảnh sau"
                  >
                    <span className="text-xl">›</span>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Images Slider */}
            {images.length > 1 && (
              <div className="relative">
                {/* Previous Button */}
                {thumbnailStart > 0 && (
                  <button
                    onClick={handlePrevThumbnail}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full shadow-md p-2 hover:bg-[#D4A574] hover:text-white transition-all"
                  >
                    <FaChevronLeft size={16} />
                  </button>
                )}
                
                {/* Thumbnails Grid */}
                <div className="grid grid-cols-4 gap-2 px-8">
                  {images.slice(thumbnailStart, thumbnailStart + thumbnailsPerPage).map((img, idx) => {
                    const actualIndex = thumbnailStart + idx;
                    return (
                      <button
                        key={actualIndex}
                        onClick={() => setSelectedImage(actualIndex)}
                        className={`aspect-square rounded-lg overflow-hidden border-3 transition-all duration-300 ${
                          selectedImage === actualIndex
                            ? 'border-[#D4A574] shadow-lg scale-105'
                            : 'border-gray-300 hover:border-[#D4A574] hover:scale-105'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${actualIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                {thumbnailStart < maxThumbnailStart && (
                  <button
                    onClick={handleNextThumbnail}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full shadow-md p-2 hover:bg-[#D4A574] hover:text-white transition-all"
                  >
                    <FaChevronRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right - Product Info */}
          <div className="space-y-6">
            {/* Product Name với họa tiết */}
            <div className="border-b-2 border-[#D4A574] pb-4">
              <h1 className="text-4xl font-bold text-[#8B4513] mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {product.name}
              </h1>
              <div className="h-1 w-20 bg-gradient-to-r from-[#D4A574] to-transparent rounded"></div>
            </div>

            {/* Rating & Actions */}
            <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-[#D4A574]/30">
              <div className="flex items-center gap-3">
                <div className="flex">{renderStars(product.rating || 0)}</div>
                <span className="text-sm font-medium text-gray-700">
                  {product.rating || 0} / 5
                </span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleToggleFavorite}
                  className="p-3 hover:bg-[#D4A574]/20 rounded-full transition-all duration-300 border border-[#D4A574]/30"
                >
                  {isFavorite ? (
                    <FaHeart className="text-red-600" size={20} />
                  ) : (
                    <FaRegHeart className="text-red-600" size={20} />
                  )}
                </button>
                <button className="p-3 hover:bg-[#D4A574]/20 rounded-full transition-all duration-300 border border-[#D4A574]/30">
                  <FaShare className="text-[#8B4513]" size={20} />
                </button>
              </div>
            </div>

            {/* Short Description với style truyền thống */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-md border-l-4 border-[#D4A574]">
              <p className="text-gray-700 leading-relaxed italic">{product.shortDescription}</p>
            </div>

            {/* Price với viền trang trí */}
            <div className="bg-gradient-to-r from-[#8B4513] to-[#A0522D] rounded-xl p-6 shadow-lg text-center border-4 border-[#D4A574]">
              <p className="text-sm text-white/80 mb-1">Giá bán</p>
              <div className="text-4xl font-bold text-white">
                {product.price.toLocaleString('vi-VN')} ₫
              </div>
            </div>

            {/* Artisan Info với icon */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-md border border-[#D4A574]/30 space-y-3">
              <div className="flex items-center gap-3">
                <FaStore className="text-[#D4A574]" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Nghệ nhân</p>
                  <p className="font-semibold text-gray-800">{product.displayName}</p>
                </div>
              </div>
              {product.shopName && (
                <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                  <FaStore className="text-[#D4A574]" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Cửa hàng</p>
                    <p className="font-semibold text-gray-800">{product.shopName}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stock với icon */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-[#D4A574]/30">
              <div className="flex items-center gap-3">
                <FaBoxOpen className="text-[#D4A574]" size={20} />
                <div className="flex-1">
                  <span className="text-sm text-gray-600">Kho: </span>
                  <span className={`font-semibold text-lg ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? `${product.stock} sản phẩm` : 'Hết hàng'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Selector với style đẹp */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-md border border-[#D4A574]/30">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Số lượng:</span>
                <div className="flex items-center border-2 border-[#D4A574] rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange('decrease')}
                    className="px-5 py-3 bg-white hover:bg-[#D4A574] hover:text-white font-bold text-xl transition-all disabled:opacity-50"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="px-8 py-3 bg-white font-bold text-lg border-x-2 border-[#D4A574]">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange('increase')}
                    className="px-5 py-3 bg-white hover:bg-[#D4A574] hover:text-white font-bold text-xl transition-all disabled:opacity-50"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons với style truyền thống */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-white border-3 border-[#D4A574] text-[#8B4513] py-4 rounded-xl font-bold text-lg hover:bg-[#D4A574] hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                <FaShoppingCart size={20} />
                Thêm vào giỏ
              </button>
              <button
                disabled={product.stock === 0}
                className="flex-1 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white py-4 rounded-xl font-bold text-lg hover:from-[#A0522D] hover:to-[#8B4513] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-2 border-[#D4A574]"
              >
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortDescription;
