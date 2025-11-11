import React from 'react';
import { Link } from 'react-router-dom';

const CheckoutBanner = () => {
  return (
    <div className="w-full bg-[#DBEFE2] py-8">
      <div className="max-w-[1440px] mx-auto px-10">
        <div className="flex flex-col gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              className="font-nunito text-lg text-text-gray hover:text-primary transition-colors"
            >
              Trang chủ
            </Link>
            <span className="font-nunito text-lg text-text-gray">/</span>
            <Link 
              to="/cart" 
              className="font-nunito text-lg text-text-gray hover:text-primary transition-colors"
            >
              Giỏ hàng
            </Link>
            <span className="font-nunito text-lg text-text-gray">/</span>
            <span className="font-nunito text-lg text-black font-semibold">
              Thanh toán
            </span>
          </div>

          {/* Title */}
          <h1 className="font-alata text-4xl text-black leading-tight">
            Thanh toán
          </h1>
        </div>
      </div>
    </div>
  );
};

export default CheckoutBanner;
