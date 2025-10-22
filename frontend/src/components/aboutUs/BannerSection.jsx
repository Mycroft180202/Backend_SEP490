
import React from 'react';

const BannerSection = ({ assets }) => (
  <div className="w-full bg-[#FBFBEE]">
    {/* Breadcrumb + Title */}
    <div className="px-8 pt-4 pb-2">
      <div className="text-[14px] text-[#222] mb-1">Trang chủ | Về chúng tôi</div>
      <h1 className="font-alata text-[28px] md:text-[32px] text-[#9e211f] font-bold mb-2">Về chúng tôi</h1>
    </div>
    {/* Banner image dưới */}
    <div className="w-full relative overflow-hidden width-full h-[300px] md:h-[400px] lg:h-[500px]">
      <img src="/images/banner.jpg" alt="banner" className="w-full h-full object-cover object-center" />
    </div>
  </div>
);

export default BannerSection;
