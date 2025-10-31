import React from 'react';

const shopAvatar = '/images/avatar.png';

export function ProductCard({ title = 'Sản phẩm', price = '100.000đ', oldPrice = '200.000đ', shop = 'Shop A' }) {
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

export function Pagination({ className = '' }) {
  return (
    <div className={`${className} flex items-center gap-4`}>
      <button className="p-2">&lt;</button>
      <div className="flex gap-4">
        <button className="font-bold">1</button>
        <button className="text-[#a0a0a0]">2</button>
        <button className="text-[#a0a0a0]">3</button>
        <span className="text-[#a0a0a0]">...</span>
        <button className="text-[#a0a0a0]">10</button>
      </div>
      <button className="p-2">&gt;</button>
    </div>
  );
}
