import React from 'react';

const NewsCard = ({ image, date, title }) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[368px]">
      <img 
        src={image} 
        alt={title}
        className="w-full h-[240px] object-cover rounded-xl" 
      />
      <div className="flex flex-col gap-0.5">
        <span className="font-nunito text-base text-text-gray">{date}</span>
        <h3 className="font-nunito text-lg font-medium text-black">{title}</h3>
      </div>
    </div>
  );
};

const DiscoverHoaLac = () => {
  const news = [
    {
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/b3a2f72f8d9e8f722f0428b8a8fb2fa9e0780415?width=736',
      date: '22-09-2025',
      title: 'Chuồn chuồn tre được tạo ra như thế nào?'
    },
    {
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/f19fbb4692615d2bea7f4e06362315b97565e15c?width=736',
      date: '22-09-2025',
      title: 'Chuồn chuồn tre được tạo ra như thế nào?'
    },
    {
      image: 'https://api.builder.io/api/v1/image/assets/TEMP/80256db7d9d5610b6d063ef99a0f760812fa4f54?width=736',
      date: '22-09-2025',
      title: 'Chuồn chuồn tre được tạo ra như thế nào?'
    }
  ];

  return (
    <>
      <section className="w-full py-[60px] px-36 bg-background">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="font-alata text-4xl text-primary leading-[56px] mb-10">
            Khám phá Hòa Lạc
          </h2>

          <div className="flex flex-col items-center gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {news.map((item, index) => (
                <NewsCard 
                  key={index}
                  {...item}
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

    </>
  );
};

export default DiscoverHoaLac;
