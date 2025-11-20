import React from 'react';
import PropTypes from 'prop-types';

const formatCurrency = (value, suffix = 'đ') => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `0${suffix}`;
  }
  return `${Number(value).toLocaleString('vi-VN')}${suffix}`;
};

const ProductReview = ({
  items = [],
  loading = false,
  currencySuffix = 'đ',
}) => {
  const renderSkeleton = () => (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={`checkout-skeleton-${idx}`}
          className="grid grid-cols-12 gap-4 items-center animate-pulse"
        >
          <div className="col-span-6 flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-gray-200" />
            <div className="space-y-2 w-full">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          <div className="col-span-2 h-4 bg-gray-200 rounded mx-auto w-14" />
          <div className="col-span-2 h-4 bg-gray-200 rounded mx-auto w-12" />
          <div className="col-span-2 h-4 bg-gray-200 rounded ms-auto w-16" />
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm checkout-card">
        <h2 className="font-alata text-2xl text-black mb-6">
          Kiem tra don hang
        </h2>
        {renderSkeleton()}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm checkout-card">
        <h2 className="font-alata text-2xl text-black mb-2">
          Kiem tra don hang
        </h2>
        <p className="text-center text-gray-500 py-6">
          Khong co san pham nao trong gio hang.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm checkout-card">
      <h2 className="font-alata text-2xl text-black mb-6">
        Kiem tra don hang
      </h2>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200">
          <div className="col-span-6">
            <span className="font-nunito text-lg font-semibold text-black">
              San pham
            </span>
          </div>
          <div className="col-span-2 text-center">
            <span className="font-nunito text-lg font-semibold text-black">
              Don gia
            </span>
          </div>
          <div className="col-span-2 text-center">
            <span className="font-nunito text-lg font-semibold text-black">
              So luong
            </span>
          </div>
          <div className="col-span-2 text-right">
            <span className="font-nunito text-lg font-semibold text-black">
              Thanh tien
            </span>
          </div>
        </div>

        {items.map((item, index) => {
          const key = item.cartItemId || item.id || item.productId || index;
          const subtotal = (item.price || 0) * (item.quantity || 0);
          const productCode = item.product?.sku
            || item.product?.code
            || item.product?.productCode
            || item.productId
            || item.id;

          return (
            <div
              key={key}
              className="grid grid-cols-12 gap-4 items-center py-4 border-b border-gray-100 last:border-b-0"
            >
              <div className="col-span-6 flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={item.imageUrl || item.image || '/images/default-product.png'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default-product.png';
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-nunito text-base font-semibold text-black">
                    {item.name}
                  </h3>
                  {productCode && (
                    <p className="font-nunito text-xs text-gray-500">
                      Ma hang: {productCode}
                    </p>
                  )}
                  {item.product?.artisanName && (
                    <p className="font-nunito text-xs text-gray-500">
                      Nguoi ban: {item.product.artisanName}
                    </p>
                  )}
                </div>
              </div>

              <div className="col-span-2 text-center font-nunito text-base text-black">
                {formatCurrency(item.price, currencySuffix)}
              </div>

              <div className="col-span-2 text-center font-nunito text-base text-black">
                x{item.quantity}
              </div>

              <div className="col-span-2 text-right font-alata text-lg font-semibold text-primary">
                {formatCurrency(subtotal, currencySuffix)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

ProductReview.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      cartItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      image: PropTypes.string,
      imageUrl: PropTypes.string,
      price: PropTypes.number,
      quantity: PropTypes.number,
      product: PropTypes.object,
    }),
  ),
  loading: PropTypes.bool,
  currencySuffix: PropTypes.string,
};

export default ProductReview;
