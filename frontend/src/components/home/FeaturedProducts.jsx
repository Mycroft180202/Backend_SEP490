import React from 'react';

const ProductCard = ({ image, title, shop, originalPrice, discountedPrice, sales, rating, reviews }) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[270px]">
      <img 
        src={image} 
        alt={title}
        className="w-full h-[320px] object-cover rounded-xl" 
      />
      <div className="flex flex-col gap-0.5">
        <h3 className="font-nunito text-lg font-medium text-black">{title}</h3>
        
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 rounded-full bg-gray-300"></div>
          <span className="font-nunito text-base text-black">{shop}</span>
        </div>
        
        <div className="flex items-baseline gap-[11px]">
          <span className="font-nunito text-base text-text-gray line-through">
            {originalPrice.toLocaleString()}đ
          </span>
          <span className="font-alata text-xl text-primary">
            {discountedPrice.toLocaleString()}đ
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="font-nunito text-base text-black">{sales} lượt bán</span>
          <div className="flex items-center gap-1">
            <span className="font-nunito text-base text-black">{rating}</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.4421 1.92495L11.9087 4.85828C12.1087 5.26662 12.6421 5.65828 13.0921 5.73328L15.7504 6.17495C17.4504 6.45828 17.8504 7.69162 16.6254 8.90828L14.5587 10.975C14.2087 11.325 14.0171 12 14.1254 12.4833L14.7171 15.0416C15.1837 17.0666 14.1087 17.85 12.3171 16.7916L9.8254 15.3166C9.3754 15.05 8.6337 15.05 8.1754 15.3166L5.6837 16.7916C3.9004 17.85 2.8171 17.0583 3.2837 15.0416L3.8754 12.4833C3.9837 12 3.7921 11.325 3.4421 10.975L1.3754 8.90828C0.1587 7.69162 0.5504 6.45828 2.2504 6.17495L4.9087 5.73328C5.3504 5.65828 5.8837 5.26662 6.0837 4.85828L7.5504 1.92495C8.3504 0.333283 9.6504 0.333283 10.4421 1.92495Z" fill="#F0BE1D"/>
            </svg>
            <span className="font-nunito text-base text-text-gray">({reviews})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeaturedProducts = () => {
  const products = [
    {
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/210b2f83d1bef686e4608e455bbd2b86301efb3b?width=540',
      title: 'Chuồn chuồn tre nhiều màu',
      shop: 'Shop A',
      originalPrice: 100000,
      discountedPrice: 200000,
      sales: 200,
      rating: 4.9,
      reviews: 80
    },
    {
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/b7d7a8ca470a7c6d9767a59f841aa17ff1baa2b8?width=540',
      title: 'Chuồn chuồn tre nhiều màu',
      shop: 'Shop A',
      originalPrice: 100000,
      discountedPrice: 200000,
      sales: 200,
      rating: 4.9,
      reviews: 80
    },
    {
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/50bc9f46b501b84da665b0bcda1ce52945d68fab?width=540',
      title: 'Chuồn chuồn tre nhiều màu',
      shop: 'Shop A',
      originalPrice: 100000,
      discountedPrice: 200000,
      sales: 200,
      rating: 4.9,
      reviews: 80
    },
    {
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/b2505589f742d732a65ea57e69986b9f91d8be98?width=540',
      title: 'Chuồn chuồn tre nhiều màu',
      shop: 'Shop A',
      originalPrice: 100000,
      discountedPrice: 200000,
      sales: 200,
      rating: 4.9,
      reviews: 80
    }
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
                {...product}
              />
            ))}
          </div>
          
          <div className="flex justify-center items-center gap-5 mt-6">
            <button className="w-6 h-6">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.9998 19.9201L8.47984 13.4001C7.70984 12.6301 7.70984 11.3701 8.47984 10.6001L14.9998 4.08008" stroke="#A0A0A0" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="flex items-center gap-5">
              <span className="font-nunito text-lg text-black">1</span>
              <span className="font-nunito text-lg text-text-light">2</span>
              <span className="font-nunito text-lg text-text-light">3</span>
              <span className="font-nunito text-lg text-text-light">...</span>
              <span className="font-nunito text-lg text-text-light">10</span>
            </div>
            <button className="w-6 h-6">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.91016 19.9201L15.4302 13.4001C16.2002 12.6301 16.2002 11.3701 15.4302 10.6001L8.91016 4.08008" stroke="black" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
