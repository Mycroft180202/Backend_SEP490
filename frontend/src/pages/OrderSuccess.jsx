import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import { LanguageContext } from '../context/LanguageContext';

const OrderSuccess = () => {
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fromState = location.state?.order;
    const storedFallback = () => {
      try {
        const stored = sessionStorage.getItem('lastOrderSuccess')
          || sessionStorage.getItem('vnpayOrderData');
        if (!stored) return null;
        return JSON.parse(stored);
      } catch (error) {
        console.error('Parse stored order error:', error);
        return null;
      }
    };

    if (fromState) {
      sessionStorage.setItem('lastOrderSuccess', JSON.stringify(fromState));
      setOrder(fromState);
      return;
    }

    const restored = storedFallback();
    if (restored) {
      setOrder(restored);
      return;
    }

    navigate('/');
  }, [location, navigate]);

  const isSuccess = order?.success === true;
  const isCOD = order?.paymentMethod === 'COD';
  const isVNPay = order?.paymentMethod === 'VNPAY';

  const priceSuffix = t('productCard.priceSuffix') || '₫';

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const parseNumber = (value) => {
    if (value === null || value === undefined) return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const statusLabel = useMemo(() => {
    if (!order?.status) {
      return t('order.statusPending') || 'Pending';
    }

    if (order.status === 'WaitingForPickup') {
      return 'Chờ xác nhận';
    }

    return order.status;
  }, [order?.status, t]);

  const { subtotal, shippingFee, discount, total } = useMemo(() => {
    if (!order) {
      return {
        subtotal: 0,
        shippingFee: 0,
        discount: 0,
        total: 0,
      };
    }
    const clientSummary = order.clientSummary || {};
    const pickNumber = (...candidates) => {
      for (const candidate of candidates) {
        const numeric = parseNumber(candidate);
        if (numeric !== null) {
          return numeric;
        }
      }
      return 0;
    };

    const computedSubtotal = pickNumber(
      order.subtotal,
      order.totalBeforeDiscount,
      order.amountBeforeDiscount,
      order.orderSubtotal,
      clientSummary.subtotal,
    );

    const computedShipping = pickNumber(
      order.shippingFee,
      order.shipingFee,
      order.deliveryFee,
      order.shippingCost,
      clientSummary.shippingFee,
    );

    const computedDiscount = pickNumber(
      order.discount,
      order.discountAmount,
      order.promotionAmount,
      clientSummary.discount,
    );

    const computedTotal = pickNumber(
      order.total,
      order.totalAmount,
      order.amount,
      order.grandTotal,
      clientSummary.total,
      computedSubtotal + computedShipping - computedDiscount,
    );

    return {
      subtotal: computedSubtotal,
      shippingFee: computedShipping,
      discount: computedDiscount,
      total: Math.max(computedTotal, 0),
    };
  }, [order]);

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <div className="max-w-2xl mx-auto px-4 md:px-10 py-12">
          {isSuccess ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
              {/* Success Icon */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                  <svg
                    className="w-12 h-12 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                {t('order.success') || 'Đặt hàng thành công'}
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                {order.message || 'Cảm ơn bạn đã đặt hàng'}
              </p>

              {/* Order Details */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {t('order.details') || 'Chi tiết đơn hàng'}
                </h2>

                <div className="space-y-3 text-sm md:text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {t('order.orderId') || 'Mã đơn hàng'}:
                    </span>
                    <span className="font-semibold text-gray-800">
                      {order.orderId}
                    </span>
                  </div>

                  <div className="border-t border-gray-300" />

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {t('order.paymentMethod') || 'Phương thức thanh toán'}:
                    </span>
                    <span className="font-semibold text-gray-800">
                      {isCOD ? 'Thanh toán khi nhận hàng (COD)' : 'VNPAY'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {t('order.status') || 'Trạng thái'}:
                    </span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                      {statusLabel}
                    </span>
                  </div>

                  {isCOD && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                      <p className="text-blue-800 text-sm">
                        💡 {t('order.codInfo') || 'Bạn sẽ thanh toán khi nhận hàng. Vui lòng chuẩn bị tiền mặt hoặc thẻ tín dụng.'}
                      </p>
                    </div>
                  )}

                  {isVNPay && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
                      <p className="text-blue-800 text-sm">
                        💡 {t('order.vnpayInfo') || 'Thanh toán đã được xử lý qua VNPAY. Hóa đơn sẽ được gửi đến email của bạn.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('order.summary') || 'Tóm tắt đơn hàng'}
                </h3>

                <div className="space-y-2 text-sm md:text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="text-gray-800">
                      {formatCurrency(subtotal)} {priceSuffix}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="text-gray-800">
                      {formatCurrency(shippingFee)} {priceSuffix}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giảm giá:</span>
                      <span className="text-red-600">
                        -{formatCurrency(discount)} {priceSuffix}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
                    <span className="text-gray-800">Tổng cộng:</span>
                    <span className="text-primary text-lg">
                      {formatCurrency(total)} {priceSuffix}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/order-history')}
                  className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-[#7a1a18] transition-colors"
                >
                  {t('order.viewOrders') || 'Xem đơn hàng của tôi'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
                >
                  {t('order.continueShopping') || 'Tiếp tục mua sắm'}
                </button>
              </div>

              {order.expectedDelivery && (
                <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                     <strong>{t('order.expectedDelivery') || 'Thời gian giao hàng dự kiến'}</strong>: {order.expectedDelivery}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
              {/* Error Icon */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
                  <svg
                    className="w-12 h-12 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                {t('order.failed') || 'Đặt hàng thất bại'}
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                {order.message || 'Có lỗi xảy ra. Vui lòng thử lại'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-[#7a1a18] transition-colors"
                >
                  {t('order.retryCheckout') || 'Quay lại thanh toán'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
                >
                  {t('order.backHome') || 'Về trang chủ'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
