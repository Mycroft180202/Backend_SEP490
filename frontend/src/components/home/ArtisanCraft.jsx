import React from 'react';

const ArtisanCraft = () => {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] lg:h-[658px] overflow-hidden">
      {/* Background image with gradient overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(270deg, rgba(0, 0, 0, 0.00) 49.97%, rgba(0, 0, 0, 0.20) 100%), url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600')`,
        }}
      >
        {/* Decorative wave pattern overlay */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 658" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="artisan-gradient" x1="720" y1="329" x2="-229" y2="329" gradientUnits="userSpaceOnUse">
              <stop stopOpacity="0"/>
              <stop offset="1" stopOpacity="0.2"/>
            </linearGradient>
          </defs>
          <path d="M720.5 0C910.265 0 1069.43 18.8289 1112.51 44.1992C1152.77 28.908 1258.01 18 1381.5 18C1539.73 18 1668 35.9086 1668 58C1668 77.2924 1570.17 93.3934 1440 97.1641V560.835C1570.17 564.606 1668 580.708 1668 600C1668 622.091 1539.73 640 1381.5 640C1258.01 640 1152.77 629.091 1112.51 613.8C1069.43 639.17 910.265 658 720.5 658C529.565 658 369.604 638.937 327.707 613.329C288.384 628.867 182.254 640 57.5 640C-100.73 640 -229 622.091 -229 600C-229 580.658 -130.673 564.523 0 560.806V97.1934C-130.673 93.4764 -229 77.3418 -229 58C-229 35.9086 -100.73 18 57.5 18C182.254 18 288.384 29.1321 327.707 44.6699C369.605 19.0625 529.565 0 720.5 0Z" fill="url(#artisan-gradient)" fillOpacity="0.2"/>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-10 lg:px-36 h-full flex flex-col justify-center">
        <div className="max-w-full md:max-w-[371px]">
          <h2 className="font-alata text-2xl md:text-3xl lg:text-4xl text-white leading-tight lg:leading-[56px] mb-6 md:mb-10">
            Hòa Lạc<br />
            Nơi làng nghề sống dậy
          </h2>
          <p className="font-nunito text-base md:text-lg text-white leading-relaxed md:leading-8">
            Các sản phẩm được chế tác hoàn toàn bằng tay bởi các nghệ nhân địa phương, mang đậm nét tinh xảo, sự tỉ mỉ và tâm huyết mà sản phẩm công nghiệp khó lòng có được. Mỗi sản phẩm là một tác phẩm nghệ thuật độc bản.
          </p>
        </div>
      </div>

      {/* Pagination controls with shadow */}
      <div className="absolute bottom-[100px] left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex justify-center items-center gap-5 px-3 py-2" style={{filter: 'drop-shadow(0 0 10.3px rgba(0, 0, 0, 0.50))'}}>
          <button className="w-6 h-6">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.9998 19.9201L8.47984 13.4001C7.70984 12.6301 7.70984 11.3701 8.47984 10.6001L14.9998 4.08008" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-5">
            <span className="font-nunito text-lg text-white">1</span>
            <span className="font-nunito text-lg text-white">2</span>
            <span className="font-nunito text-lg text-white">3</span>
            <span className="font-nunito text-lg text-white">...</span>
            <span className="font-nunito text-lg text-white">10</span>
          </div>
          <button className="w-6 h-6">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.91016 19.9201L15.4302 13.4001C16.2002 12.6301 16.2002 11.3701 15.4302 10.6001L8.91016 4.08008" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ArtisanCraft;
