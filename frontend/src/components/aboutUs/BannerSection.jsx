import CustomBreadcrumbs from '../shared/CustomBreadcrumbs';
import React from 'react';

const BannerSection = ({ assets }) => (
  <div className="w-full bg-[#FBFBEE]">
    <CustomBreadcrumbs
      breadcrumbs={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Về chúng tôi', href: '/about' }
      ]}
    />
    {/* Banner image dưới */}
    <div className="w-full relative overflow-hidden width-full h-[300px] md:h-[400px] lg:h-[500px]">
      <img src="/images/banner.jpg" alt="banner" className="w-full h-full object-cover object-center" />
    </div>
  </div>
);

export default BannerSection;
