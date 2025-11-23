import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import { LanguageContext } from '../context/LanguageContext';

const PaymentResult = () => {
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPaymentResult = async () => {
      try {
        // Try to get from location state first (direct navigation)
        let data = location.state?.orderData;

        // If not in state, get from URL search params (VNPAY callback)
        if (!data) {
          const vnpayCode = searchParams.get('vnp_ResponseCode');
          if (!vnpayCode) {
            // No data at all, redirect to home
            navigate('/');
            return;
          }

          // Determine status based on VNPay response code
          const isSuccess = vnpayCode === '00';
          data = {
            success: isSuccess,
            paymentMethod: 'VNPAY',
            status: isSuccess ? 'Success' : 'Failed',
            message: isSuccess
              ? 'Thanh toán VNPay thành công'
              : 'Thanh toán VNPay thất bại hoặc bị hủy',
            vnpayResponseCode: vnpayCode,
          };
        }

        setOrderData(data);
        setPaymentStatus(data.success ? 'success' : 'failed');
      } catch (error) {
        console.error('Error loading payment result:', error);
        setPaymentStatus('error');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentResult();
  }, [location, searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-600">
              {t('order.processing') || 'Đang xử lý...'}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  const priceSuffix = t('productCard.priceSuffix') || '₫';

  const formatCurrency = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <div className="max-w-2xl mx-auto px-4 md:px-10 py-12">
          {paymentStatus === 'success' ? (
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

              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                {t('payment.success') || 'Thanh toán thành công'}
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                {orderData.message || 'Thanh toán VNPay của bạn đã được xác nhận'}
              </p>

              {/* Order Details */}
              {orderData.orderId && (
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
                        {orderData.orderId}
                      </span>
                    </div>

                    <div className="border-t border-gray-300" />

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {t('order.paymentMethod') || 'Phương thức thanh toán'}:
                      </span>
                      <span className="font-semibold text-gray-800">
                        VNPAY
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {t('order.status') || 'Trạng thái'}:
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        {orderData.status || 'Success'}
                      </span>
                    </div>
                  </div>

                  {orderData.total && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-gray-800">Tổng cộng:</span>
                        <span className="text-primary text-lg">
                          {formatCurrency(orderData.total)} {priceSuffix}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                <p className="text-green-800 text-sm">
                  ✓ {t('payment.successInfo') || 'Đơn hàng của bạn đã được tạo. Bạn sẽ nhận được email xác nhận trong vài phút.'}
                </p>
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
                {paymentStatus === 'error'
                  ? t('payment.error') || 'Lỗi thanh toán'
                  : t('payment.failed') || 'Thanh toán thất bại'}
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                {orderData.message
                  || 'Thanh toán VNPay đã bị từ chối hoặc hủy. Vui lòng thử lại.'}
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                <p className="text-red-800 text-sm">
                  ⚠️ {t('payment.failedInfo') || 'Nếu bạn tin rằng đây là một sai lầm, vui lòng thử lại hoặc liên hệ với chúng tôi.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-[#7a1a18] transition-colors"
                >
                  {t('payment.retryPayment') || 'Thử thanh toán lại'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/order-history')}
                  className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors"
                >
                  {t('order.viewOrders') || 'Xem đơn hàng'}
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

export default PaymentResult;
