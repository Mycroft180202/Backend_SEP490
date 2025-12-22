import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaBox, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PaymentActions = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Track Order Button */}
        <button
          onClick={() => navigate('/order-tracking')}
          className="w-full py-3 bg-primary rounded-lg font-nunito text-lg font-semibold text-white hover:bg-[#7a1a18] transition-colors flex items-center justify-center gap-2"
        >
          <FaBox size={20} />
          Theo dõi đơn hàng
        </button>

        {/* Download Invoice Button */}
        <button
          onClick={() => toast.info('Tính năng tải hóa đơn sẽ sớm được cập nhật.')}
          className="w-full py-3 bg-white border-2 border-primary rounded-lg font-nunito text-lg font-semibold text-primary hover:bg-[#DBEFE2] transition-colors flex items-center justify-center gap-2"
        >
          <FaDownload size={20} />
          Tải hóa đơn
        </button>

        {/* Continue Shopping Button */}
        <button
          onClick={() => navigate('/shop')}
          className="w-full py-3 bg-background border border-gray-300 rounded-lg font-nunito text-lg font-semibold text-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <FaHome size={20} />
          Tiếp tục mua sắm
        </button>

        {/* Support Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="font-nunito text-base text-text-gray text-center mb-2">
            Cần hỗ trợ?
          </p>
          <div className="flex flex-col gap-2">
            <a 
              href="tel:0123456789"
              className="font-nunito text-base text-primary hover:underline text-center"
            >
              Hotline: 0123 456 789
            </a>
            <a 
              href="mailto:support@hoalac.vn"
              className="font-nunito text-base text-primary hover:underline text-center"
            >
              Email: support@hoalac.vn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentActions;
