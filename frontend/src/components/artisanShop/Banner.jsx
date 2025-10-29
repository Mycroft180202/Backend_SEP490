import React from 'react';
import CustomBreadcrumbs from '../shared/CustomBreadcrumbs';


// Background image (nếu nằm trong public/images)
const imgC = "/images/Rectangle 38.png";
const imgFb = "/images/FacebookLogo.png";
// Figma assets (nếu bạn dùng được link trực tiếp)
const imgEllipse41 = "https://www.figma.com/api/mcp/asset/0ec54aba-2293-4b43-8c96-166b2524ff62";
const imgVuesaxLinearStar = "/images/star.png";
const imgVuesaxLinearMessage = "/images/message.png";
const imgVuesaxLinearExport = "/images/Share-white-icon.png";

const Banner = () => {
  return (
    <section className="relative container mx-auto px-4 py-12 min-h-[300px]">
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        <img
          src={imgC}
          alt="Background C"
          className="w-full h-full object-cover"
        />
      </div>

 {/* Breadcrumb đè lên banner, giữ vị trí tương tự (responsive padding) */}
      <div className="absolute left-4 top-4 md:left-8 md:top-8 z-20">
        <div className="text-white">
          <CustomBreadcrumbs
            breadcrumbs={[
              { label: 'Trang chủ', href: '/' },
              { label: 'Cửa hàng', href: '/about' }
            ]}
          />
        </div>
      </div>
      {/* Banner Content */}
      <div className="relative z-10 flex flex-col gap-6 pt-20">
        <div className="flex gap-6 items-start">
          <img src={imgEllipse41} alt="Shop logo" className="w-20 h-20" />
          <div>
            <h1 className="text-3xl font-bold text-white">Shop A</h1>
            <div className="flex items-center gap-2">
              <img
                src={imgVuesaxLinearStar}
                alt="star icon"
                className="w-6 h-6"
              />
              <p className="text-base text-white">4.9</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <img
              src={imgVuesaxLinearMessage}
              alt="message icon"
              className="w-6 h-6"
            />
            <p className="text-lg text-white">Chat với shop</p>
          </div>
          <div className="flex items-center gap-2">
            <img
              src={imgVuesaxLinearExport}
              alt="export icon"
              className="w-6 h-6"
            />
            <p className="text-lg text-white">Chia sẻ</p>
          </div>

          {/* Frame 427 Content */}
          <div className="ml-auto flex gap-4 items-center pr-6">
            <p className="text-lg text-white">Tìm hiểu thêm tại</p>
            <div className="overflow-clip relative shrink-0 w-12 h-12">
              <img
                src={imgFb}
                alt="Social Icon"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
