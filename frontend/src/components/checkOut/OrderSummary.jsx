import React, { useMemo } from 'react';
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
  currencySuffix = ' VND',
  onPlaceOrder = () => {},
  placingOrder = false,
  disabled = false,
  shippingLoading = false,
  vouchers = { shared: [], personal: [] },
  selectedVoucherCode = '',
  onVoucherSelect = () => {},
  voucherLoading = false,
}) => {
  const normalizedShared = Array.isArray(vouchers?.shared) ? vouchers.shared : [];
  const normalizedPersonal = Array.isArray(vouchers?.personal) ? vouchers.personal : [];
  const allVouchers = useMemo(
    () => [...normalizedPersonal, ...normalizedShared],
    [normalizedPersonal, normalizedShared],
  );
  const normalizedDiscount = Number(discount) || 0;
  const normalizedSubtotal = Number(subtotal) || 0;
  const normalizedShipping = Number(shipping) || 0;

  const computedTotal = useMemo(() => {
    const baseTotal = (typeof total === 'number' && !Number.isNaN(total))
      ? Number(total)
      : normalizedSubtotal + normalizedShipping;
    return Math.max(baseTotal - normalizedDiscount, 0);
  }, [normalizedDiscount, normalizedShipping, normalizedSubtotal, total]);

  const handlePlaceOrder = () => {
    if (!disabled && !placingOrder) {
      onPlaceOrder();
    }
  };

  const isVoucherEligible = (voucher) => {
    if (!voucher) return false;
    const minAmount = Number(voucher.minOrderAmount) || 0;
    if (minAmount <= 0) return true;
    return normalizedSubtotal >= minAmount;
  };

  const voucherLabel = (voucher) => {
    if (!voucher) {
      return { primary: '', secondary: '' };
    }
    const type = (voucher.discountType || '').toLowerCase();
    let discountText = '';
    if (type === 'percent') {
      const percent = Number.isFinite(Number(voucher.discountValue)) ? Number(voucher.discountValue) : 0;
      discountText = `Giảm ${percent}%`;
    }
    const value = voucher.discountValue ?? 0;
    if (!discountText) {
      discountText = `Giảm ${formatCurrency(value, currencySuffix)}`;
    }

    const minAmount = Number(voucher.minOrderAmount) || 0;
    const maxDiscountAmount = Number(voucher.maxDiscountAmount) || 0;
    const details = [];
    if (minAmount > 0) {
      details.push(`ĐH tối thiểu ${formatCurrency(minAmount, currencySuffix)}`);
    }
    if (maxDiscountAmount > 0) {
      details.push(`Giảm tối đa ${formatCurrency(maxDiscountAmount, currencySuffix)}`);
    }
    const detailText = details.length ? details.join(' | ') : '';
    const eligible = isVoucherEligible(voucher);
    const requirementText = !eligible && minAmount > 0 ? 'Chưa đạt giá trị tối thiểu' : '';

    const secondaryParts = [discountText];
    if (detailText) secondaryParts.push(detailText);
    if (requirementText) secondaryParts.push(requirementText);
    const secondary = secondaryParts.filter(Boolean).join(' - ');

    return {
      primary: voucher.code || 'Voucher',
      secondary,
    };
  };

  const handleVoucherChange = (event) => {
    const { value } = event.target;
    if (!value) {
      onVoucherSelect('');
      return;
    }
    const selected = allVouchers.find((voucher) => voucher?.code === value);
    if (selected && !isVoucherEligible(selected)) {
      return;
    }
    onVoucherSelect(value);
  };

  const handleClearVoucher = () => {
    onVoucherSelect('');
  };

  return (
    <div className="bg-gradient-to-br from-[#faded5] via-[#f7cfc5] to-[#faded5] rounded-xl p-6 shadow-sm checkout-card sticky top-24">
      <h2 className="font-alata text-2xl text-black text-center mb-6">
        Đơn hàng của bạn
      </h2>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span className="font-nunito text-lg text-black">Tạm tính</span>
          <span className="font-nunito text-lg text-black">
            {formatCurrency(subtotal, currencySuffix)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-nunito text-lg text-black">Phí vận chuyển</span>
          <span className="font-nunito text-lg text-black">
            {shippingLoading ? (
              <span className="inline-block h-5 w-20 bg-gray-200 animate-pulse rounded" />
            ) : (
              formatCurrency(shipping, currencySuffix)
            )}
          </span>
        </div>

        {normalizedDiscount > 0 && (
          <div className="flex justify-between items-center">
            <span className="font-nunito text-lg text-black">Giảm giá</span>
            <span className="font-nunito text-lg text-primary">
              -{formatCurrency(normalizedDiscount, currencySuffix)}
            </span>
          </div>
        )}

        <div className="w-full h-px bg-text-gray" />

        <div className="flex justify-between items-center">
          <span className="font-nunito text-xl font-semibold text-black">
            Tổng cộng
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
          <label htmlFor="voucher-select" className="font-nunito text-base text-black">
            Voucher của bạn
          </label>
          {voucherLoading ? (
            <div className="h-11 rounded-lg bg-gray-200 animate-pulse" />
          ) : (
            <>
              <select
                id="voucher-select"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                value={selectedVoucherCode}
                onChange={handleVoucherChange}
                disabled={!allVouchers.length}
              >
                <option value="">Không sử dụng Voucher</option>
                {normalizedPersonal.length > 0 && (
                  <optgroup label="Voucher cá nhân">
                    {normalizedPersonal.map((voucher) => {
                      const eligible = isVoucherEligible(voucher);
                      const label = voucherLabel(voucher);
                      const optionText = label.secondary
                        ? `${label.primary}\n${label.secondary}`
                        : label.primary;
                      return (
                        <option
                          key={`personal-${voucher.code}`}
                          value={voucher.code}
                          disabled={!eligible}
                          style={{ whiteSpace: 'pre-line' }}
                        >
                          {optionText}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                {normalizedShared.length > 0 && (
                  <optgroup label="Voucher chung">
                    {normalizedShared.map((voucher) => {
                      const eligible = isVoucherEligible(voucher);
                      const label = voucherLabel(voucher);
                      const optionText = label.secondary
                        ? `${label.primary}\n${label.secondary}`
                        : label.primary;
                      return (
                        <option
                          key={`shared-${voucher.code}`}
                          value={voucher.code}
                          disabled={!eligible}
                          style={{ whiteSpace: 'pre-line' }}
                        >
                          {optionText}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
              </select>
              {!allVouchers.length && (
                <p className="text-sm text-text-gray">
                  Bạn chưa có Voucher hợp lệ.
                </p>
              )}
              {selectedVoucherCode && (
                <button
                  type="button"
                  onClick={handleClearVoucher}
                  className="self-start text-sm text-primary hover:underline"
                >
                  Bỏ chọn Voucher
                </button>
              )}
            </>
          )}
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
          {placingOrder ? 'Đang đặt hàng...' : 'Đặt hàng'}
        </button>

        <p className="font-nunito text-sm text-text-gray text-center mt-2">
          Bằng việc đặt hàng, bạn đồng ý với{' '}
          <a href="/policy" className="text-primary hover:underline">
            điều khoản sử dụng
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
  vouchers: PropTypes.shape({
    shared: PropTypes.arrayOf(PropTypes.shape({
      code: PropTypes.string,
      discountType: PropTypes.string,
      discountValue: PropTypes.number,
      maxDiscountAmount: PropTypes.number,
      minOrderAmount: PropTypes.number,
    })),
    personal: PropTypes.arrayOf(PropTypes.shape({
      code: PropTypes.string,
      discountType: PropTypes.string,
      discountValue: PropTypes.number,
      maxDiscountAmount: PropTypes.number,
      minOrderAmount: PropTypes.number,
    })),
  }),
  selectedVoucherCode: PropTypes.string,
  onVoucherSelect: PropTypes.func,
  voucherLoading: PropTypes.bool,
};

export default OrderSummary;
