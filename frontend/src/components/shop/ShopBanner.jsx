import React from 'react';

const ShopBanner = () => {
  return (
    <section className="relative w-full h-[300px] md:h-[400px] lg:h-[600px] bg-red-700">
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/Shopbanner.jpg"
          alt="Shop Banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Typo Content */}
      <div className="absolute inset-0 flex items-center left-[250px]">
        <div className="text-white">
          <h1 className="text-4xl md:text-5xl font-bold">
            Chào mừng đến với
          </h1>
          <p className="text-4xl md:text-5xl mt-2">
            Gian hàng của Hoa Lac Handicraft
          </p>
        </div>
      </div>
    </section>
  );
};

export default ShopBanner;