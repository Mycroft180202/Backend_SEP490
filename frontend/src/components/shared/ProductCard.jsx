import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart } from 'react-icons/fa';
import { LanguageContext } from '../../context/LanguageContext';

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
  variant,
  image,
  title,
  shortDescription,
  price,
  rating,
  loading,
  shopName,
  originalPrice,
  discountedPrice,
  sales,
  reviews,
  stock,
  onAddToCart,
  onClick,
}) => {
  const { t } = useContext(LanguageContext);
  const priceSuffix = t('productCard.priceSuffix');

  const handleAddToCart = (event) => {
    event.stopPropagation();
    if (onAddToCart) {
      onAddToCart();
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
        <img
          src={image}
          alt={title}
          className="w-full h-[320px] object-cover rounded-xl"
        />
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
        className={`group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-[#D4A574] ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(event) => {
          if (onClick && (event.key === 'Enter' || event.key === ' ')) {
            onClick();
          }
        }}
      >
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#FFF8E7] to-white rounded-t-2xl">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {price !== undefined && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-[#8B4513] to-[#A0522D] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              {formatCurrency(price, priceSuffix)}
            </div>
          )}
        </div>
        <div className="p-5 space-y-3 bg-white">
          <h3 className="text-lg font-semibold text-[#8B4513] line-clamp-2 group-hover:text-[#D4A574] transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {title}
          </h3>
          {shopName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4A574] to-[#8B4513] flex items-center justify-center text-white text-xs font-bold">
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
            <span className="text-[#8B4513] font-semibold group-hover:text-[#D4A574]">
              {`${t('productCard.viewDetail')} →`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group bg-white rounded-xl overflow-hidden border border-[#D4A574]/30 hover:border-[#D4A574] transition-all duration-300 hover:shadow-xl ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          onClick();
        }
      }}
    >
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#FFF8E7] to-white">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      <div className="p-4 bg-gradient-to-b from-white to-[#FFFBF0]">
        <h3 className="font-['Nunito'] text-lg font-semibold text-[#8B4513] mb-2 line-clamp-2 group-hover:text-[#D4A574] transition min-h-[56px]">
          {title}
        </h3>
        <p className="font-['Nunito'] text-sm text-gray-600 mb-3 line-clamp-2 min-h-[40px]">
          {shortDescription || t('productCard.fallbackDescription')}
        </p>
        <div className="flex items-center gap-1 mb-3">
          {renderStars(rating || 0)}
          <span className="text-sm text-gray-600 ml-1">
            {t('productCard.rating', { count: (Number(rating) || 0).toFixed(1) })}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#D4A574]/20">
          <span className="text-xl font-bold text-[#8B4513] font-['Nunito']">
            {formatCurrency(price, priceSuffix)}
          </span>
          <button
            type="button"
            className={`bg-[#8B4513] text-white p-2 rounded-lg transition ${onAddToCart ? 'hover:bg-[#D4A574]' : 'opacity-60 cursor-not-allowed'}`}
            onClick={handleAddToCart}
            disabled={!onAddToCart}
          >
            <FaShoppingCart className="text-lg" />
          </button>
        </div>
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
  onClick: PropTypes.func,
};

ProductCard.defaultProps = {
  variant: 'grid',
  image: '',
  title: '',
  shortDescription: '',
  price: 0,
  rating: 0,
  loading: false,
  shopName: '',
  originalPrice: undefined,
  discountedPrice: undefined,
  sales: undefined,
  reviews: undefined,
  stock: undefined,
  onAddToCart: undefined,
  onClick: undefined,
};

export default ProductCard;
