import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaShare,
  FaChevronLeft,
  FaChevronRight,
  FaShoppingCart,
  FaStore,
  FaBoxOpen,
  FaBolt,
} from 'react-icons/fa';
import { LanguageContext } from '../../context/LanguageContext';
import { UserContext } from '../../context/UserContext';
import { CartService } from '../../services/modules/cart/cartService';

const ShortDescription = ({ product }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [thumbnailStart, setThumbnailStart] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const { t } = useContext(LanguageContext);
  const { userInfo } = useContext(UserContext);
  const navigate = useNavigate();

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : ['/images/default-product.png'];

  const mainImage = images[selectedImage] || images[0];
  const thumbnailsPerPage = 4;
  const maxThumbnailStart = Math.max(0, images.length - thumbnailsPerPage);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i += 1) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i += 1) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }
    return stars;
  };

  const handleQuantityChange = (type) => {
    if (type === 'increase' && quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    } else if (type === 'decrease' && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const ensureAuthenticated = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) return true;
    if (!userInfo) {
      toast.info(t('messages.loginRequired'));
      setTimeout(() => {
        navigate('/login', { replace: true, state: { from: `/product-detail/${product.id}` } });
      }, 1200);
    }
    return false;
  };

  const handleAddToCart = async (redirect = false) => {
    if (!ensureAuthenticated()) return;
    try {
      await CartService.addItem(product.id, product.price ?? 0, quantity);
      toast.success(redirect ? t('messages.addedToCartRedirect') : t('messages.addedToCart'));
      if (redirect) {
        navigate('/cart');
      }
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message
        || err?.response?.data?.title
        || err?.message
        || t('messages.addToCartError');
      toast.error(message);
    }
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
    setIsFavorite((prev) => !prev);
  };

  return (
    <div className="w-full py-8 bg-gradient-to-b from-[#FFF8E7] to-[#FFFDEB]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-[#D4A574]">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5" />
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-3 hover:bg-[#D4A574] hover:text-white transition-all duration-300 border-2 border-[#D4A574]"
                    aria-label="Previous image"
                  >
                    <span className="text-xl">{'<'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg p-3 hover:bg-[#D4A574] hover:text-white transition-all duration-300 border-2 border-[#D4A574]"
                    aria-label="Next image"
                  >
                    <span className="text-xl">{'>'}</span>
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="relative">
                {thumbnailStart > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevThumbnail}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full shadow-md p-2 hover:bg-[#D4A574] hover:text-white transition-all"
                  >
                    <FaChevronLeft size={16} />
                  </button>
                )}

                <div className="grid grid-cols-4 gap-2 px-8">
                  {images.slice(thumbnailStart, thumbnailStart + thumbnailsPerPage).map((img, idx) => {
                    const actualIndex = thumbnailStart + idx;
                    return (
                      <button
                        type="button"
                        key={img}
                        onClick={() => setSelectedImage(actualIndex)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                          selectedImage === actualIndex
                            ? 'border-[#D4A574] shadow-lg ring-2 ring-[#8B4513]/40'
                            : 'border-transparent hover:border-[#D4A574]/50'
                        }`}
                      >
                        <img src={img} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>

                {thumbnailStart < maxThumbnailStart && (
                  <button
                    type="button"
                    onClick={handleNextThumbnail}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full shadow-md p-2 hover:bg-[#D4A574] hover:text-white transition-all"
                  >
                    <FaChevronRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#FFF1E5] text-[#8B4513] px-3 py-1 rounded-full text-xs font-semibold border border-[#D4A574]/40">
                  <FaStore />
                  {product?.artisanName || 'Hoa Lac Handicraft'}
                </div>
                <h1 className="mt-3 text-2xl md:text-3xl font-bold text-[#8B4513] leading-snug">
                  {product.name}
                </h1>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-lg text-yellow-400">
                    {renderStars(product.rating || 0)}
                  </div>
                  <span className="text-sm text-gray-500">
                    {t('productCard.rating', { count: (product.rating || 0).toFixed(1) })}
                  </span>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm text-gray-500">
                    {t('productCard.sold', { count: product.sold || 0 })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className="p-3 hover:bg-[#D4A574]/20 rounded-full transition-all duration-300 border border-[#D4A574]/30"
                >
                  {isFavorite ? (
                    <FaHeart className="text-red-500" size={20} />
                  ) : (
                    <FaRegHeart className="text-red-600" size={20} />
                  )}
                </button>
                <button
                  type="button"
                  className="p-3 hover:bg-[#D4A574]/20 rounded-full transition-all duration-300 border border-[#D4A574]/30"
                >
                  <FaShare className="text-[#8B4513]" size={20} />
                </button>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border-l-4 border-[#D4A574]">
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">{product.shortDescription}</p>
            </div>

            <div className="bg-gradient-to-r from-[#8B4513] to-[#A0522D] rounded-xl p-5 shadow-lg text-center border-2 border-[#D4A574]">
              <p className="text-sm text-white/80 mb-1">Giá bán</p>
              <div className="text-3xl font-bold text-white">
                {product.price.toLocaleString('vi-VN')} ₫
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-[#E2C8A2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#D4A574]">
                  <img
                    src={product.artisanAvatar || '/images/default-avatar.png'}
                    alt={product.artisanName || 'artisan'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Người bán</p>
                  <p className="text-base md:text-lg font-semibold text-[#8B4513]">{product.artisanName || 'Nghệ nhân làng nghề'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-[#FFF8E7] px-3 py-2 rounded-full border border-[#E2C8A2]">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange('decrease')}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-[#D4A574] text-[#8B4513] hover:bg-[#D4A574] hover:text-white transition text-sm"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-base font-semibold text-[#8B4513]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange('increase')}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-[#D4A574] text-[#8B4513] hover:bg-[#D4A574] hover:text-white transition text-sm"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  <FaBoxOpen className="inline-block mr-1 text-[#8B4513]" />
                  {product.stock > 0 ? `${product.stock} sản phẩm có sẵn` : 'Hết hàng'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#8B4513] text-white text-lg font-semibold shadow-lg hover:bg-[#DDA15E] transition-all duration-300 disabled:opacity-60"
                  disabled={product.stock <= 0}
                >
                  <FaShoppingCart />
                  {t('productCard.addToCart')}
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[#8B4513] text-[#8B4513] text-lg font-semibold hover:bg-[#FFF8E7] transition-all duration-300 disabled:opacity-60"
                  disabled={product.stock <= 0}
                >
                  <FaBolt />
                  {t('productCard.buyNow')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortDescription;
