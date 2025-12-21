import React from 'react';
import Breadcrumb from '../shared/Breadcrumb';
import { SECTION_SUBTITLE_CLASS, SECTION_TITLE_CLASS } from '../../utils/homeTheme';

const BannerSection = ({ breadcrumbItems }) => {
  const title = breadcrumbItems?.[breadcrumbItems.length - 1]?.label || 'About';
  return (
    <section className="relative w-full bg-[#FFF6E9]">
      <div className="relative w-full h-[360px] md:h-[460px] lg:h-[520px] overflow-hidden">
        <img
          src="/images/banner.jpg"
          alt="banner"
          className="w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#101527]/55 via-[#101527]/28 to-transparent pointer-events-none" />

        {breadcrumbItems?.length > 0 && (
          <div className="absolute left-4 sm:left-8 top-5 sm:top-7 z-10">
            <Breadcrumb items={breadcrumbItems} floating />
          </div>
        )}

        <div className="absolute inset-0 z-10 flex items-end">
          <div className="w-full px-4 sm:px-8 lg:px-12 pb-10 sm:pb-14">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-block rounded-[28px] bg-[#101527]/25 px-6 py-5 sm:px-10 sm:py-6 shadow-[0_16px_50px_rgba(0,0,0,0.25)]">
                <h1 className={`${SECTION_TITLE_CLASS} !text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.35)]`}>
                  {title}
                </h1>
                <p className={`${SECTION_SUBTITLE_CLASS} !text-white/90 mt-3 max-w-3xl mx-auto`}>
                  Hoa Lac Handicraft kết nối những giá trị truyền thống với nhịp sống hiện đại qua từng sản phẩm thủ công.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 translate-y-[1px] pointer-events-none">
          <svg
            className="w-full h-16 md:h-20"
            viewBox="0 0 1440 120"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0 C240 80 480 -20 720 60 C960 140 1200 -20 1440 60 L1440 120 L0 120 Z"
              fill="#FFF6E9"
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default BannerSection;
