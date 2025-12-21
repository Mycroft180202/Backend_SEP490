import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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

  const translate = useCallback((key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  }, [t]);

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
              ? translate('payment.successMessage', 'Thanh toán VNPay của bạn đã được xác nhận.')
              : translate('payment.failedMessage', 'Thanh toán VNPay thất bại hoặc đã bị hủy.'),
            vnpayResponseCode: vnpayCode,
          };
        }

        setOrderData(data);
        setPaymentStatus(data.success ? 'success' : 'failed');
      } catch (error) {
        console.error('Error loading payment result:', error);
        setOrderData({
          success: false,
          message: translate('payment.errorMessage', 'Chúng tôi không thể xác nhận trạng thái thanh toán. Vui lòng thử lại sau.'),
          paymentMethod: 'VNPAY',
        });
        setPaymentStatus('error');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentResult();
  }, [location, searchParams, navigate, translate]);

  const statusLabel = useMemo(() => {
    if (paymentStatus === 'success') {
      return translate('payment.status.success', 'Thành công');
    }
    if (paymentStatus === 'failed') {
      return translate('payment.status.failed', 'Thất bại');
    }
    if (paymentStatus === 'error') {
      return translate('payment.status.error', 'Lỗi không xác định');
    }
    return translate('payment.status.pending', 'Đang xử lý');
  }, [paymentStatus, translate]);

  const successHighlights = useMemo(() => ([
    translate('payment.successHighlight.orderCreated', 'Đơn hàng của bạn đã được tạo thành công.'),
    translate('payment.successHighlight.track', 'Theo dõi tiến trình trong mục Lịch sử đơn hàng.'),
  ]), [translate]);

  const failureTips = useMemo(() => ([
    translate('payment.failureTip.retry', 'Kiểm tra lại số dư và thử thanh toán lại.'),
    translate('payment.failureTip.alternative', 'Chọn phương thức thanh toán khác nếu cần.'),
    translate('payment.failureTip.support', 'Liên hệ hỗ trợ nếu giao dịch đã bị trừ tiền.'),
  ]), [translate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-600">
              {translate('order.processing', 'Đang xử lý...')}
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="relative flex-grow bg-gradient-to-br from-amber-50 via-white to-rose-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-24 h-72 w-72 bg-primary/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-36 -right-24 h-80 w-80 bg-yellow-200/20 blur-3xl rounded-full" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 md:px-10 py-16">
          {paymentStatus === 'success' ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8 md:p-14 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-amber-400 to-primary" />

              <div className="flex flex-col gap-10">
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 shadow-inner rounded-full">
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

                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {translate('payment.success', 'Thanh toán thành công')}
                  </h1>
                  <p className="text-gray-600 mb-6 text-lg leading-relaxed max-w-2xl mx-auto">
                    {orderData.message
                      || translate('payment.successMessage', 'Thanh toán VNPay của bạn đã được xác nhận.')}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-green-900 mb-3">
                    {translate('payment.nextSteps', 'Bước tiếp theo')}
                  </h3>
                  <ul className="grid gap-3 md:grid-cols-3 text-sm text-green-800">
                    {successHighlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <span aria-hidden="true">✓</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() => navigate('/order-history')}
                    className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-[#7a1a18] transition-colors shadow"
                  >
                    {translate('order.viewOrders', 'Xem đơn hàng của tôi')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/shop')}
                    className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold hover:border-gray-300 transition-colors shadow-sm"
                  >
                    {translate('order.continueShopping', 'Tiếp tục mua sắm')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8 md:p-14 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-rose-400 to-red-500" />

              <div className="flex flex-col gap-10">
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 shadow-inner rounded-full">
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

                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {paymentStatus === 'error'
                      ? translate('payment.error', 'Có lỗi khi xử lý thanh toán')
                      : translate('payment.failed', 'Thanh toán thất bại')}
                  </h1>
                  <p className="text-gray-600 mb-6 text-lg leading-relaxed max-w-2xl mx-auto">
                    {orderData.message
                      || translate('payment.failedMessage', 'Thanh toán VNPay thất bại hoặc đã bị hủy.')}
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-red-100 rounded-2xl p-6 text-left shadow-sm">
                    <h2 className="text-lg font-semibold text-red-900 mb-4">
                      {translate('payment.transactionDetails', 'Thông tin giao dịch')}
                    </h2>
                    <div className="space-y-3 text-sm md:text-base">
                      {orderData.orderId && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">
                            {translate('order.orderId', 'Mã đơn hàng')}:
                          </span>
                          <span className="font-semibold text-gray-800 text-right">
                            {orderData.orderId}
                          </span>
                        </div>
                      )}

                      {orderData.paymentMethod && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">
                            {translate('order.paymentMethod', 'Phương thức thanh toán')}:
                          </span>
                          <span className="font-semibold text-gray-800 text-right">
                            {orderData.paymentMethod}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between gap-4 items-center">
                        <span className="text-gray-600">
                          {translate('order.status', 'Trạng thái')}:
                        </span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          {statusLabel}
                        </span>
                      </div>

                      {orderData.vnpayResponseCode && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">
                            VNPay code:
                          </span>
                          <span className="font-semibold text-gray-800">
                            {orderData.vnpayResponseCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {translate('payment.nextSteps', 'Bước tiếp theo')}
                    </h2>
                    <ul className="space-y-3 text-sm md:text-base text-gray-700">
                      {failureTips.map((tip) => (
                        <li key={tip} className="flex items-start gap-2">
                          <span aria-hidden="true">⚠️</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm md:text-base text-red-800">
                  {translate('payment.failedInfo', 'Nếu bạn tin rằng đây là một sai sót, vui lòng thử lại hoặc liên hệ với chúng tôi để được hỗ trợ.')}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() => navigate('/checkout')}
                    className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-[#7a1a18] transition-colors shadow"
                  >
                    {translate('payment.retryPayment', 'Thử thanh toán lại')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/order-history')}
                    className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold hover:border-gray-300 transition-colors shadow-sm"
                  >
                    {translate('order.viewOrders', 'Xem đơn hàng')}
                  </button>
                </div>
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
