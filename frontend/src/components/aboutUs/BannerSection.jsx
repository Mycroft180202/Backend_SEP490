import CustomBreadcrumbs from '../shared/CustomBreadcrumbs';
import React from 'react';

const BannerSection = ({ assets }) => (
  <div className="w-full bg-[#FBFBEE]">
    {/* Banner image dưới */}
    <div className="w-full relative overflow-hidden width-full h-[300px] md:h-[400px] lg:h-[500px]">
      <img src="/images/banner.jpg" alt="banner" className="w-full h-full object-cover object-center" />

      {/* Breadcrumb đè lên banner, giữ vị trí tương tự (responsive padding) */}
      <div className="absolute left-4 top-4 md:left-8 md:top-8 z-20">
        <div className="bg-white/80 rounded-md px-3 py-1 backdrop-blur-sm">
          <CustomBreadcrumbs
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Về chúng tôi', href: '/about' }
            ]}
          />
        </div>
      </div>
    </div>
  </div>
);

export default BannerSection;
