import React from 'react';
import PropTypes from 'prop-types';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ProductCard = ({ image, title, shortDescription, price, rating, loading }) => {
  return (
    <div className="border rounded-lg p-4 shadow-md">
      {loading ? (
        <Skeleton height={150} />
      ) : (
        <img src={image} alt={title} className="w-full h-40 object-cover rounded-md" />
      )}
      <div className="mt-4">
        <h3 className="text-lg font-semibold">
          {loading ? <Skeleton width={100} /> : title}
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          {loading ? <Skeleton count={2} /> : shortDescription}
        </p>
        <div className="mt-4">
          <span className="text-primary font-bold">
            {loading ? <Skeleton width={50} /> : `${price?.toLocaleString('vi-VN')}₫`}
          </span>
          <div className="flex items-center mt-2">
            {loading ? (
              <Skeleton width={80} />
            ) : (
              <>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <svg
                    key={idx}
                    xmlns="http://www.w3.org/2000/svg"
                    fill={idx < Math.round(rating || 0) ? 'gold' : 'none'}
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-yellow-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.122 6.564a1 1 0 00.95.69h6.905c.969 0 1.371 1.24.588 1.81l-5.588 4.06a1 1 0 00-.364 1.118l2.122 6.564c.3.921-.755 1.688-1.54 1.118l-5.588-4.06a1 1 0 00-1.176 0l-5.588 4.06c-.784.57-1.838-.197-1.54-1.118l2.122-6.564a1 1 0 00-.364-1.118l-5.588-4.06c-.783-.57-.38-1.81.588-1.81h6.905a1 1 0 00.95-.69l2.122-6.564z"
                    />
                  </svg>
                ))}
                <span className="ml-2 text-sm text-gray-600">{rating?.toFixed(1) || '0.0'}</span>
              </>
            )}
          </div>
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
