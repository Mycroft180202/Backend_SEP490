import React from 'react';

const PaymentDetails = () => {
  // Mock data - should come from order context/state in real implementation
  const paymentData = {
    orderId: '#DH123456',
    orderDate: new Date().toLocaleDateString('vi-VN'),
    paymentMethod: 'Thanh toán khi nhận hàng (COD)',
    items: [
      {
        id: 1,
        name: 'Tách trà gốm sứ Bát Tràng',
        quantity: 2,
        price: 75000,
        image: '/images/products/product1.jpg'
      },
      {
        id: 2,
        name: 'Bình hoa gốm Chu Đậu',
        quantity: 1,
        price: 150000,
        image: '/images/products/product2.jpg'
      }
    ],
    subtotal: 300000,
    shipping: 30000,
    discount: 0,
    total: 330000,
    shippingAddress: {
      name: 'Nguyễn Văn A',
      phone: '0123456789',
      address: '123 Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh'
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm">
      <h2 className="font-alata text-2xl text-black mb-6">
        Chi tiết đơn hàng
      </h2>

      {/* Order Info */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <p className="font-nunito text-base text-text-gray mb-1">Mã đơn hàng</p>
          <p className="font-nunito text-lg font-semibold text-black">
            {paymentData.orderId}
          </p>
        </div>
        <div>
          <p className="font-nunito text-base text-text-gray mb-1">Ngày đặt</p>
          <p className="font-nunito text-lg font-semibold text-black">
            {paymentData.orderDate}
          </p>
        </div>
        <div className="col-span-2">
          <p className="font-nunito text-base text-text-gray mb-1">
            Phương thức thanh toán
          </p>
          <p className="font-nunito text-lg font-semibold text-black">
            {paymentData.paymentMethod}
          </p>
        </div>
      </div>

      {/* Products List */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="font-nunito text-xl font-semibold text-black mb-4">
          Sản phẩm đã đặt
        </h3>
        <div className="flex flex-col gap-4">
          {paymentData.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 bg-background rounded-lg">
              <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-text-gray">No image</div>';
                  }}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-nunito text-lg text-black mb-1">
                  {item.name}
                </h4>
                <p className="font-nunito text-base text-text-gray">
                  Số lượng: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-nunito text-lg font-semibold text-primary">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-nunito text-base text-text-gray">Tạm tính</span>
            <span className="font-nunito text-lg text-black">
              {paymentData.subtotal.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-nunito text-base text-text-gray">Phí vận chuyển</span>
            <span className="font-nunito text-lg text-black">
              {paymentData.shipping.toLocaleString('vi-VN')}đ
            </span>
          </div>
          {paymentData.discount > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-nunito text-base text-text-gray">Giảm giá</span>
              <span className="font-nunito text-lg text-primary">
                -{paymentData.discount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          )}
          <div className="h-px bg-gray-200 my-2"></div>
          <div className="flex justify-between items-center">
            <span className="font-nunito text-xl font-semibold text-black">
              Tổng cộng
            </span>
            <span className="font-alata text-2xl font-semibold text-primary">
              {paymentData.total.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="font-nunito text-xl font-semibold text-black mb-4">
          Địa chỉ giao hàng
        </h3>
        <div className="bg-[#DBEFE2] rounded-lg p-4">
          <p className="font-nunito text-lg font-semibold text-black mb-1">
            {paymentData.shippingAddress.name}
          </p>
          <p className="font-nunito text-base text-text-gray mb-1">
            {paymentData.shippingAddress.phone}
          </p>
          <p className="font-nunito text-base text-text-gray">
            {paymentData.shippingAddress.address}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
