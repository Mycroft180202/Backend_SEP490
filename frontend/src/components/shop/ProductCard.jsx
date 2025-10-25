import React from 'react';

const shopAvatar = '/images/avatar.png';

export default function ProductCard({ title = 'Sản phẩm', price = '100.000đ', oldPrice = '200.000đ', shop = 'Shop A' }) {
  return (
    <div className="w-full max-w-[270px]">
      <div className="bg-[#d9d9d9] h-[320px] rounded-[12px] mb-3" />
      <h3 className="font-Nunito font-medium text-[18px]">{title}</h3>
      <div className="flex items-center gap-2">
        <img src={shopAvatar} alt="shop avatar" className="w-6 h-6 rounded-full" />
        <p className="text-sm">{shop}</p>
      </div>
      <div className="flex items-baseline gap-3">
        <p className="text-[#686868]">{price}</p>
        <p className="text-[#9e211f] font-Alata">{oldPrice}</p>
      </div>
    </div>
  );
}
