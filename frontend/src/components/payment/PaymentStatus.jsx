import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const PaymentStatus = ({ status = 'success' }) => {
  const isSuccess = status === 'success';

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Success Icon */}
        <div className={`w-24 h-24 rounded-full ${isSuccess ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
          {isSuccess ? (
            <FaCheckCircle className="w-16 h-16 text-green-500" />
          ) : (
            <FaTimesCircle className="w-16 h-16 text-red-500" />
          )}
        </div>

        {/* Status Message */}
        <div className="text-center">
          <h2 className="font-alata text-3xl text-black mb-2">
            {isSuccess ? 'Đặt hàng thành công!' : 'Thanh toán thất bại'}
          </h2>
          <p className="font-nunito text-lg text-text-gray">
            {isSuccess 
              ? 'Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý.'
              : 'Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.'}
          </p>
        </div>

        {/* Order Number */}
        {isSuccess && (
          <div className="bg-[#DBEFE2] rounded-lg p-4 w-full max-w-md">
            <div className="flex justify-between items-center">
              <span className="font-nunito text-base text-text-gray">
                Mã đơn hàng:
              </span>
              <span className="font-nunito text-lg font-semibold text-primary">
                #DH{Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}
              </span>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <p className="font-nunito text-base text-text-gray text-center max-w-2xl">
          {isSuccess 
            ? 'Chúng tôi đã gửi email xác nhận đến địa chỉ email của bạn. Bạn có thể theo dõi tình trạng đơn hàng trong mục "Đơn hàng của tôi".'
            : 'Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua hotline hoặc email.'}
        </p>
      </div>
    </div>
  );
};

export default PaymentStatus;
