import React from 'react';
import ProductCard from '../shared/ProductCard';

const FeaturedProducts = () => {
  const products = [
    {
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/210b2f83d1bef686e4608e455bbd2b86301efb3b?width=540',
      title: 'Chuông tre trang trí nhiều màu',
      shopName: 'Shop A',
      originalPrice: 100000,
      discountedPrice: 200000,
      sales: 200,
      rating: 4.9,
      reviews: 80,
    },
    {
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/b7d7a8ca470a7c6d9767a59f841aa17ff1baa2b8?width=540',
      title: 'Chuông tre nhiều màu phối hạt',
      shopName: 'Shop A',
      originalPrice: 100000,
      discountedPrice: 200000,
      sales: 200,
      rating: 4.9,
      reviews: 80,
    },
    {
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/50bc9f46b501b84da665b0bcda1ce52945d68fab?width=540',
      title: 'Chuông tre sơn mài họa tiết',
      shopName: 'Shop A',
      originalPrice: 100000,
      discountedPrice: 200000,
      sales: 200,
      rating: 4.9,
      reviews: 80,
    },
    {
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/b2505589f742d732a65ea57e69986b9f91d8be98?width=540',
      title: 'Chuông tre phối dây vải',
      shopName: 'Shop A',
      originalPrice: 100000,
      discountedPrice: 200000,
      sales: 200,
      rating: 4.9,
      reviews: 80,
    },
  ];

  return (
    <section className="w-full py-12 md:py-20 lg:py-[120px] px-4 md:px-10 lg:px-36 bg-background">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="font-alata text-2xl md:text-3xl lg:text-4xl text-primary leading-tight lg:leading-[56px] mb-6 md:mb-10">
          Sản phẩm nổi bật
        </h2>

        <div className="flex flex-col items-center gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {products.map((product, index) => (
              <ProductCard
                key={index}
                variant="featured"
                {...product}
              />
            ))}
          </div>

          <div className="flex justify-center items-center gap-5 mt-6">
            <button type="button" className="w-6 h-6">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.9998 19.9201L8.47984 13.4001C7.70984 12.6301 7.70984 11.3701 8.47984 10.6001L14.9998 4.08008" stroke="#A0A0A0" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex items-center gap-5">
              <span className="font-nunito text-lg text-black">1</span>
              <span className="font-nunito text-lg text-text-light">2</span>
              <span className="font-nunito text-lg text-text-light">3</span>
              <span className="font-nunito text-lg text-text-light">...</span>
              <span className="font-nunito text-lg text-text-light">10</span>
            </div>
            <button type="button" className="w-6 h-6">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.91016 19.9201L15.4302 13.4001C16.2002 12.6301 16.2002 11.3701 15.4302 10.6001L8.91016 4.08008" stroke="black" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
