import React from 'react';

const ProductReview = () => {
  // Mock data - should come from cart context/state in real implementation
  const cartItems = [
    {
      id: 1,
      name: 'Chuồn chuồn tre Thạch Xá',
      size: '15x15cm',
      price: 50000,
      quantity: 2,
      image: '/images/products/chuonchuon.jpg'
    },
    {
      id: 2,
      name: 'Quạt Quảng Sơn',
      size: '30x30cm',
      price: 100000,
      quantity: 1,
      image: '/images/products/quat.jpg'
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="font-alata text-2xl text-black mb-6">
        Kiểm tra đơn hàng
      </h2>

      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-300">
          <div className="col-span-6">
            <span className="font-nunito text-lg font-semibold text-black">
              Sản phẩm
            </span>
          </div>
          <div className="col-span-2 text-center">
            <span className="font-nunito text-lg font-semibold text-black">
              Đơn giá
            </span>
          </div>
          <div className="col-span-2 text-center">
            <span className="font-nunito text-lg font-semibold text-black">
              Số lượng
            </span>
          </div>
          <div className="col-span-2 text-right">
            <span className="font-nunito text-lg font-semibold text-black">
              Thành tiền
            </span>
          </div>
        </div>

        {/* Product Items */}
        {cartItems.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-4 items-center py-4 border-b border-gray-200">
            {/* Product Info */}
            <div className="col-span-6 flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/images/placeholder.png';
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-nunito text-base font-semibold text-black">
                  {item.name}
                </h3>
                <p className="font-nunito text-sm text-text-gray">
                  Kích thước: {item.size}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="col-span-2 text-center">
              <span className="font-nunito text-base text-black">
                {item.price.toLocaleString('vi-VN')}đ
              </span>
            </div>

            {/* Quantity */}
            <div className="col-span-2 text-center">
              <span className="font-nunito text-base text-black">
                x{item.quantity}
              </span>
            </div>

            {/* Subtotal */}
            <div className="col-span-2 text-right">
              <span className="font-alata text-lg font-semibold text-primary">
                {(item.price * item.quantity).toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {cartItems.length === 0 && (
          <div className="py-12 text-center">
            <p className="font-nunito text-lg text-text-gray">
              Không có sản phẩm nào trong giỏ hàng
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReview;
