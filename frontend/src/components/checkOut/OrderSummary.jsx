import React from 'react';
import { useNavigate } from 'react-router-dom';

const OrderSummary = () => {
  const navigate = useNavigate();

  // Mock data - should come from cart context/state in real implementation
  const orderData = {
    subtotal: 150000,
    shipping: 30000,
    discount: 0,
    total: 180000
  };

  const handlePlaceOrder = () => {
    // Handle order placement logic here
    alert('Đặt hàng thành công!');
    navigate('/order-tracking');
  };

  return (
    <div className="bg-[#DBEFE2] rounded-xl p-6 shadow-sm sticky top-24">
      <h2 className="font-alata text-2xl text-black text-center mb-6">
        Đơn hàng của bạn
      </h2>

      <div className="flex flex-col gap-4">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="font-nunito text-lg text-black">
            Tạm tính
          </span>
          <span className="font-nunito text-lg text-black">
            {orderData.subtotal.toLocaleString('vi-VN')}đ
          </span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between items-center">
          <span className="font-nunito text-lg text-black">
            Phí vận chuyển
          </span>
          <span className="font-nunito text-lg text-black">
            {orderData.shipping.toLocaleString('vi-VN')}đ
          </span>
        </div>

        {/* Discount */}
        {orderData.discount > 0 && (
          <div className="flex justify-between items-center">
            <span className="font-nunito text-lg text-black">
              Giảm giá
            </span>
            <span className="font-nunito text-lg text-primary">
              -{orderData.discount.toLocaleString('vi-VN')}đ
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-text-gray"></div>

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-nunito text-xl font-semibold text-black">
            Tổng cộng
          </span>
          <span className="font-alata text-2xl font-semibold text-primary">
            {orderData.total.toLocaleString('vi-VN')}đ
          </span>
        </div>

        {/* Coupon Code */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="font-nunito text-base text-black">
            Mã giảm giá
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã giảm giá"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-nunito text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button className="px-6 py-2 bg-white border border-primary rounded-lg font-nunito text-base font-semibold text-primary hover:bg-primary hover:text-white transition-colors">
              Áp dụng
            </button>
          </div>
        </div>

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          className="w-full py-3 bg-primary rounded-lg font-nunito text-lg font-semibold text-white hover:bg-[#7a1a18] transition-colors mt-4"
        >
          Đặt hàng
        </button>

        {/* Terms */}
        <p className="font-nunito text-sm text-text-gray text-center mt-2">
          Bằng việc đặt hàng, bạn đồng ý với{' '}
          <a href="/terms" className="text-primary hover:underline">
            Điều khoản sử dụng
          </a>{' '}
          của chúng tôi
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;
