import CustomBreadcrumbs from '../shared/CustomBreadcrumbs';
import React from 'react';

const BannerSection = ({ assets }) => (
  <div className="relative w-full bg-[#FBFBEE]">
    {/* Banner image dưới */}
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px]">
      <img
        src="/images/banner.jpg"
        alt="banner"
        className="w-full h-full object-cover object-center"
      />
      {/* Breadcrumbs đè lên banner */}
      <div className="absolute top-4 left-4">
        <div className="bg-white/80 py-2 px-4 rounded-md">
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
