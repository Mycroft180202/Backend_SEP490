import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart, FaBolt, FaHeart, FaRegHeart } from 'react-icons/fa';
import { LanguageContext } from '../../context/LanguageContext';
import { WishlistService } from '../../services/modules/wishlist/wishlistService';
import { toast } from 'react-toastify';

const renderStars = (ratingValue) => {
  const rating = Number(ratingValue) || 0;
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i += 1) {
    stars.push(<FaStar key={i} className="text-yellow-500" />);
  }
  if (hasHalfStar) {
    stars.push(<FaStarHalfAlt key="half" className="text-yellow-500" />);
  }
  const emptyStars = 5 - stars.length;
  for (let i = 0; i < emptyStars; i += 1) {
    stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-500" />);
  }
  return stars;
};

const formatCurrency = (value, suffix = '') => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '';
  }
  return `${Number(value).toLocaleString('vi-VN')}${suffix}`;
};

const ProductCard = ({
  variant = 'grid',
  image = '',
  title = '',
  shortDescription = '',
  price = 0,
  rating = 0,
  loading = false,
  shopName = '',
  originalPrice,
  discountedPrice,
  sales,
  reviews,
  stock,
  onAddToCart,
  onBuyNow,
  onClick,
  onToggleWishlist,
  isWished = false,
  productId,
}) => {
  const { t, language } = useContext(LanguageContext);
  const priceSuffix = t('productCard.priceSuffix');
  const priceLabel = t('productCard.priceLabel');
  const priceLabelText = priceLabel && priceLabel.includes('productCard.priceLabel')
    ? (language === 'en' ? 'Price' : 'Giá bán')
    : priceLabel;
  const soldOutLabel = t('productCard.soldOut');
  const soldOutText = soldOutLabel && soldOutLabel.includes('productCard.soldOut')
    ? 'Hết hàng'
    : soldOutLabel || 'Hết hàng';
  const isOutOfStock = typeof stock === 'number' ? Number(stock) <= 0 : false;

  const handleAddToCart = (event) => {
    event.stopPropagation();
    if (isOutOfStock) {
      toast.info(soldOutText);
      return;
    }
    if (onAddToCart) {
      onAddToCart();
    }
  };

  const handleBuyNow = (event) => {
    event.stopPropagation();
    if (onBuyNow) {
      onBuyNow();
    }
  };

  const handleWishlist = async (event) => {
    event.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist();
      return;
    }
    if (!productId) return;
    try {
      await WishlistService.add(productId);
      toast.success(t('Đã thêm vào yêu thích') || 'Đã thêm vào yêu thích');
    } catch (err) {
      console.error('Add wishlist error:', err);
      toast.error(
        err?.response?.data?.message
        || err?.message
        || 'Đăng nhập để thêm vào yêu thích.',
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl overflow-hidden border border-[#D4A574]/30 shadow-md">
        <Skeleton height={256} />
        <div className="p-4">
          <Skeleton height={24} className="mb-2" />
          <Skeleton count={2} className="mb-3" />
          <Skeleton height={20} width={100} />
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        className={`flex flex-col gap-6 w-full max-w-[270px] ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(event) => {
          if (onClick && (event.key === 'Enter' || event.key === ' ')) {
            onClick();
          }
        }}
      >
        <div className="relative">
          <img
            src={image}
            alt={title}
            className="w-full h-[320px] object-cover rounded-xl"
          />
          {(isOutOfStock || onToggleWishlist || productId) && (
            <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
              {isOutOfStock && (
                <div className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold shadow">
                  {soldOutText}
                </div>
              )}
              {(onToggleWishlist || productId) && (
                <button
                  type="button"
                  onClick={handleWishlist}
                  className={`bg-white/95 rounded-full p-2 shadow hover:bg-white transition transform hover:scale-110 active:scale-125 relative ${isWished ? 'ring-2 ring-red-300' : ''}`}
                >
                  {isWished && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-red-400/40" aria-hidden />
                  )}
                  {isWished ? <FaHeart className="text-[#E53935] relative" /> : <FaRegHeart className="text-[#E53935] relative" />}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-nunito text-lg font-medium text-black line-clamp-2 min-h-[56px]">
            {title}
          </h3>
          {shopName && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 uppercase">
                {shopName.charAt(0) || '?'}
              </div>
              <span className="font-nunito text-base text-black truncate">{shopName}</span>
            </div>
          )}
          <div className="flex items-baseline gap-3">
            {originalPrice !== undefined && (
              <span className="font-nunito text-base text-gray-500 line-through">
                {formatCurrency(originalPrice, priceSuffix)}
              </span>
            )}
            {discountedPrice !== undefined && (
              <span className="font-alata text-xl text-primary">
                {formatCurrency(discountedPrice, priceSuffix)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
          {sales !== undefined && (
            <span>{t('productCard.sold', { count: sales })}</span>
          )}
            <div className="flex items-center gap-1">
              <span>{(Number(rating) || 0).toFixed(1)}</span>
              <FaStar className="text-yellow-400" />
              <span className="text-gray-500">
                {t('productCard.rating', { count: reviews ?? 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'related') {
    return (
      <div
        className={`group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-brand-600/20 hover:border-accent/60 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(event) => {
          if (onClick && (event.key === 'Enter' || event.key === ' ')) {
            onClick();
          }
        }}
      >
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-background to-white rounded-t-2xl">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {(isOutOfStock || price !== undefined) && (
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
              {isOutOfStock && (
                <div className="px-3 py-1 rounded-full bg-[#C0392B] text-white text-xs font-semibold shadow">
                  {soldOutText}
                </div>
              )}
              {price !== undefined && (
                <div className="bg-gradient-to-r from-primary to-primary-dark text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  {formatCurrency(price, priceSuffix)}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="p-5 space-y-3 bg-white">
          <h3 className="text-lg font-semibold text-brand-900 line-clamp-2 group-hover:text-accent transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {title}
          </h3>
          {shopName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-soft to-primary flex items-center justify-center text-white text-xs font-bold">
                {shopName.charAt(0)?.toUpperCase()}
              </div>
              <span className="truncate">{shopName}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex">{renderStars(rating || 0)}</div>
            <span className="text-sm text-gray-600">
              {t('productCard.rating', { count: rating || 0 })}
            </span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            {stock !== undefined && (
              <span className="text-sm text-gray-500">
                {t('productCard.stock', { stock: stock || 0 })}
              </span>
            )}
            <span className="text-primary font-semibold group-hover:text-accent">
              {`${t('productCard.viewDetail')} ->`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group bg-white rounded-[28px] overflow-hidden border border-brand-600/20 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} h-full flex flex-col`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          onClick();
        }
      }}
    >
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-background to-white">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {(isOutOfStock || onToggleWishlist || productId) && (
          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
              {isOutOfStock && (
                <div className="px-3 py-1 rounded-full bg-[#C0392B] text-white text-xs font-semibold shadow">
                {soldOutText}
              </div>
            )}
            {(onToggleWishlist || productId) && (
              <button
                type="button"
                onClick={handleWishlist}
                className={`relative bg-white/95 rounded-full p-2 shadow hover:bg-white transition transform hover:scale-110 active:scale-125 ${isWished ? 'ring-2 ring-accent/60' : ''}`}
              >
                {isWished && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-accent/40" aria-hidden />
                )}
                {isWished ? <FaHeart className="text-[#E53935] relative" /> : <FaRegHeart className="text-[#E53935] relative" />}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-5 bg-gradient-to-b from-white to-background flex flex-col gap-3 border-t border-brand-600/20 flex-1">
        <h3 className="font-['Nunito'] text-lg font-semibold text-brand-900 line-clamp-2 min-h-[48px] group-hover:text-accent transition-colors">
          {title}
        </h3>
        <p className="font-['Nunito'] text-sm text-gray-600 line-clamp-2 min-h-[36px]">
          {shortDescription || t('productCard.fallbackDescription')}
        </p>
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.15em] text-brand-600">
          <span className="truncate">{priceLabelText}</span>
          <div className="flex items-center gap-1 text-brand-600">
            {renderStars(rating || 0)}
            <span className="text-xs font-semibold ml-1 text-brand-900">
              {(Number(rating) || 0).toFixed(1)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xl font-bold text-brand-900 font-['Nunito']">
              {formatCurrency(price, priceSuffix)}
            </p>
          </div>
          {stock !== undefined && (
            <span
              className={`text-sm font-['Nunito'] ${
                isOutOfStock ? 'text-[#C0392B] font-semibold' : 'text-gray-500'
              }`}
            >
              {t('productCard.stock', { stock: stock || 0 })}
            </span>
          )}
        </div>
        {(onAddToCart || onBuyNow) && (
          <div className="mt-auto flex gap-2">
            {onAddToCart && (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-[14px] px-3 py-2.5 text-sm font-['Nunito'] font-semibold transition-all duration-200 ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white shadow-[0_8px_18px_rgba(68,99,63,0.35)] hover:-translate-y-0.5 hover:bg-primary-dark'
                }`}
              >
                <FaShoppingCart className="text-sm" />
                <span>{t('productCard.addToCart')}</span>
              </button>
            )}
            {onBuyNow && (
              <button
                type="button"
                onClick={(event) => {
                  if (isOutOfStock) {
                    event.stopPropagation();
                    toast.info(soldOutText);
                    return;
                  }
                  handleBuyNow(event);
                }}
                disabled={isOutOfStock}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-[14px] border-2 px-3 py-2.5 text-sm font-['Nunito'] font-semibold transition-all duration-200 ${
                  isOutOfStock
                    ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'border-accent text-accent hover:bg-accent/10 hover:-translate-y-0.5'
                }`}
              >
                <FaBolt className="text-sm" />
                <span>{t('productCard.buyNow')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  variant: PropTypes.oneOf(['grid', 'featured', 'related']),
  image: PropTypes.string,
  title: PropTypes.string,
  shortDescription: PropTypes.string,
  price: PropTypes.number,
  rating: PropTypes.number,
  loading: PropTypes.bool,
  shopName: PropTypes.string,
  originalPrice: PropTypes.number,
  discountedPrice: PropTypes.number,
  sales: PropTypes.number,
  reviews: PropTypes.number,
  stock: PropTypes.number,
  onAddToCart: PropTypes.func,
  onBuyNow: PropTypes.func,
  onClick: PropTypes.func,
  onToggleWishlist: PropTypes.func,
  isWished: PropTypes.bool,
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ProductCard;
