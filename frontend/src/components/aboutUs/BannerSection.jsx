import React from 'react';
import Breadcrumb from '../shared/Breadcrumb';

const BannerSection = ({ breadcrumbItems }) => (
  <div className="relative w-full bg-[#FBFBEE]">
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden">
      <img
        src="/images/banner.jpg"
        alt="banner"
        className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
      />
      {breadcrumbItems?.length > 0 && (
        <div className="absolute left-6 top-6 z-10">
          <Breadcrumb items={breadcrumbItems} floating />
        </div>
      )}
    </div>
  </div>
);

export default BannerSection;
