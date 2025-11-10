import React from 'react';
import PropTypes from 'prop-types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart } from 'react-icons/fa';

const ProductCard = ({ image, title, shortDescription, price, rating, loading }) => {
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

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-[#D4A574]/30 hover:border-[#D4A574] transition-all duration-300 hover:shadow-xl">
      {/* Product Image */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#FFF8E7] to-white">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Product Info */}
      <div className="p-4 bg-gradient-to-b from-white to-[#FFFBF0]">
        {/* Product Name */}
        <h3 className="font-['Nunito'] text-lg font-semibold text-[#8B4513] mb-2 line-clamp-2 group-hover:text-[#D4A574] transition min-h-[56px]">
          {title}
        </h3>

        {/* Short Description */}
        <p className="font-['Nunito'] text-sm text-gray-600 mb-3 line-clamp-2 min-h-[40px]">
          {shortDescription || 'Sản phẩm thủ công mỹ nghệ truyền thống'}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {renderStars(rating || 0)}
          <span className="text-sm text-gray-600 ml-1">
            ({rating?.toFixed(1) || '0.0'})
          </span>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-2 border-t border-[#D4A574]/20">
          <span className="text-xl font-bold text-[#8B4513] font-['Nunito']">
            {price?.toLocaleString('vi-VN')}đ
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

ProductCard.propTypes = {
  image: PropTypes.string,
  title: PropTypes.string,
  shortDescription: PropTypes.string,
  price: PropTypes.number,
  rating: PropTypes.number,
  loading: PropTypes.bool,
};

ProductCard.defaultProps = {
  image: '',
  title: '',
  shortDescription: '',
  price: 0,
  rating: 0,
  loading: false,
};

export default ProductCard;
