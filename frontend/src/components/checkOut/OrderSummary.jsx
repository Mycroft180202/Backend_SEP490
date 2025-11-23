import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const formatCurrency = (value, suffix = 'đ') => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return `0${suffix}`;
  }
  return `${Number(value).toLocaleString('vi-VN')}${suffix}`;
};

const OrderSummary = ({
  subtotal = 0,
  shipping = 0,
  discount = 0,
  total,
  currencySuffix = 'đ',
  onPlaceOrder = () => {},
  placingOrder = false,
  disabled = false,
  shippingLoading = false,
}) => {
  const [couponCode, setCouponCode] = useState('');

  const computedTotal = useMemo(() => {
    if (typeof total === 'number' && !Number.isNaN(total)) {
      return total;
    }
    return Math.max(subtotal + shipping - discount, 0);
  }, [discount, shipping, subtotal, total]);

  const handleApplyCoupon = () => {
    // Placeholder for future coupon integration
    if (couponCode) {
      // eslint-disable-next-line no-alert
      alert('Chuc nang ma giam gia se cap nhat sau.');
    }
  };

  const handlePlaceOrder = () => {
    if (!disabled && !placingOrder) {
      onPlaceOrder();
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#faded5] via-[#f7cfc5] to-[#faded5] rounded-xl p-6 shadow-sm checkout-card sticky top-24">
      <h2 className="font-alata text-2xl text-black text-center mb-6">
        Don hang cua ban
      </h2>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="font-nunito text-lg text-black">Tam tinh</span>
          <span className="font-nunito text-lg text-black">
            {formatCurrency(subtotal, currencySuffix)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-nunito text-lg text-black">Phi van chuyen</span>
          <span className="font-nunito text-lg text-black">
            {shippingLoading ? (
              <span className="inline-block h-5 w-20 bg-gray-200 animate-pulse rounded" />
            ) : (
              formatCurrency(shipping, currencySuffix)
            )}
          </span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between items-center">
            <span className="font-nunito text-lg text-black">Giam gia</span>
            <span className="font-nunito text-lg text-primary">
              -{formatCurrency(discount, currencySuffix)}
            </span>
          </div>
        )}

        <div className="w-full h-px bg-text-gray" />

        <div className="flex justify-between items-center">
          <span className="font-nunito text-xl font-semibold text-black">
            Tong cong
          </span>
          <span className="font-alata text-2xl font-semibold text-primary">
            {shippingLoading ? (
              <span className="inline-block h-8 w-32 bg-gray-200 animate-pulse rounded" />
            ) : (
              formatCurrency(computedTotal, currencySuffix)
            )}
          </span>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <label htmlFor="coupon-input" className="font-nunito text-base text-black">
            Ma giam gia
          </label>
          <div className="flex gap-2">
            <input
              id="coupon-input"
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Nhap ma giam gia"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="px-6 py-2 bg-white border border-primary rounded-lg font-nunito text-base font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
            >
              Ap dung
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePlaceOrder}
          className={`w-full py-3 rounded-lg font-nunito text-lg font-semibold text-white transition-colors mt-4 checkout-cta ${
            disabled || placingOrder
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-[#7a1a18]'
          }`}
          disabled={disabled || placingOrder}
        >
          {placingOrder ? 'Dang dat hang...' : 'Dat hang'}
        </button>

        <p className="font-nunito text-sm text-text-gray text-center mt-2">
          Bang viec dat hang, ban dong y voi{' '}
          <a href="/policy" className="text-primary hover:underline">
            dieu khoan su dung
          </a>
          .
        </p>
      </div>
    </div>
  );
};

OrderSummary.propTypes = {
  subtotal: PropTypes.number,
  shipping: PropTypes.number,
  discount: PropTypes.number,
  total: PropTypes.number,
  currencySuffix: PropTypes.string,
  onPlaceOrder: PropTypes.func,
  placingOrder: PropTypes.bool,
  disabled: PropTypes.bool,
  shippingLoading: PropTypes.bool,
};

export default OrderSummary;
