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

      {/* Contact Form Section */}
      <section className="w-full py-[60px] px-36 bg-background">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="font-alata text-4xl text-primary leading-[56px] mb-6 text-center">
            Thông tin liên hệ
          </h2>
          <p className="font-nunito text-lg text-text-gray text-center mb-10">
            Hãy để lại thông tin để chúng tôi có thể liên hệ với bạn
          </p>

          <div className="flex flex-col items-center gap-6 max-w-[759px] mx-auto">
            <div className="flex flex-col items-center gap-6 w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="flex flex-col items-start gap-6 w-full">
                <div className="flex items-center gap-[23px] w-full">
                  <div className="flex items-center gap-2 py-3 px-6 border border-gray-300 rounded-xl flex-1 hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z" 
                            stroke="#A0A0A0" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" 
                            stroke="#A0A0A0" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input 
                      type="email" 
                      placeholder="Email" 
                      required
                      pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                      className="flex-1 font-nunito text-lg text-text-light bg-transparent outline-none placeholder-text-light"
                    />
                  </div>
                  <div className="flex items-center gap-2 py-3 px-6 border border-gray-300 rounded-xl flex-1 hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.97 18.33C21.97 18.69 21.89 19.06 21.72 19.42C21.55 19.78 21.33 20.12 21.04 20.44C20.55 20.98 20.01 21.37 19.4 21.62C18.8 21.87 18.15 22 17.45 22C16.43 22 15.34 21.76 14.19 21.27C13.04 20.78 11.89 20.12 10.75 19.29C9.6 18.45 8.51 17.52 7.47 16.49C6.44 15.45 5.51 14.36 4.68 13.22C3.86 12.08 3.2 10.94 2.72 9.81C2.24 8.67 2 7.58 2 6.54C2 5.86 2.12 5.21 2.36 4.61C2.6 4 2.98 3.44 3.51 2.94C4.15 2.31 4.85 2 5.59 2C5.87 2 6.15 2.06 6.4 2.18C6.66 2.3 6.89 2.48 7.07 2.74L9.39 6.01C9.57 6.26 9.7 6.49 9.79 6.71C9.88 6.92 9.93 7.13 9.93 7.32C9.93 7.56 9.86 7.8 9.72 8.03C9.59 8.26 9.4 8.5 9.16 8.74L8.4 9.53C8.29 9.64 8.24 9.77 8.24 9.93C8.24 10.01 8.25 10.08 8.27 10.16C8.3 10.24 8.33 10.3 8.35 10.36C8.53 10.69 8.84 11.12 9.28 11.64C9.73 12.16 10.21 12.69 10.73 13.22C11.27 13.75 11.79 14.24 12.32 14.69C12.84 15.13 13.27 15.43 13.61 15.61C13.66 15.63 13.72 15.66 13.79 15.69C13.87 15.72 13.95 15.73 14.04 15.73C14.21 15.73 14.34 15.67 14.45 15.56L15.21 14.81C15.46 14.56 15.7 14.37 15.93 14.25C16.16 14.11 16.39 14.04 16.64 14.04C16.83 14.04 17.03 14.08 17.25 14.17C17.47 14.26 17.7 14.39 17.95 14.56L21.26 16.91C21.52 17.09 21.7 17.3 21.81 17.55C21.91 17.8 21.97 18.05 21.97 18.33Z" 
                            stroke="#A0A0A0" strokeWidth="1.5" strokeMiterlimit="10"/>
                      <path d="M18.5 9C18.5 8.4 18.03 7.48 17.33 6.73C16.69 6.04 15.84 5.5 15 5.5" 
                            stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 9C22 5.13 18.87 2 15 2" 
                            stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input 
                      type="tel" 
                      placeholder="Số điện thoại"
                      required 
                      pattern="[0-9]{10}"
                      className="flex-1 font-nunito text-lg text-text-light bg-transparent outline-none placeholder-text-light"
                    />
                  </div>
                </div>

                <div className="relative w-full">
                  <div className="relative w-full border border-gray-300 rounded-xl hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <textarea 
                      placeholder="Viết gì đó" 
                      rows="3"
                      className="w-full py-3 pl-12 pr-4 font-nunito text-lg text-text-light bg-transparent outline-none placeholder-text-light resize-none"
                    />
                    <svg className="absolute top-3 left-4 w-6 h-6 pointer-events-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.5 3.5L2.5 12.5L5.5 15.5L14.5 6.5L11.5 3.5Z" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M11.5 3.5L14.5 6.5L15.75 5.25C16.4404 4.55964 16.4404 3.44036 15.75 2.75V2.75C15.0596 2.05964 13.9404 2.05964 13.25 2.75L11.5 3.5Z" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.5 12.5L2 16L5.5 15.5" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 22H7C5.89543 22 5 21.1046 5 20V18" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13 19L17 19" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <input 
                    type="checkbox" 
                    id="newsletter" 
                    className="w-6 h-6 rounded-full border border-text-light cursor-pointer accent-primary"
                  />
                  <label htmlFor="newsletter" className="font-nunito text-base text-black cursor-pointer">
                    Đăng ký nhận thông tin về sản phẩm mới qua Email
                  </label>
                </div>
              </div>

              <button className="py-1.5 px-6 bg-primary rounded-xl hover:bg-opacity-90 transition-colors">
                <span className="font-nunito text-lg font-medium text-white">
                  Liên hệ ngay
                </span>
              </button>

              <p className="font-nunito text-lg text-black text-center">
                Hoặc quý khách có thể liên hệ trực tiếp với chúng tôi qua các kênh dưới đây
              </p>

              <div className="flex items-center justify-center gap-10">
                <a href="https://www.facebook.com/BambooWindchimesHoaLac" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-[#0866FF] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/bamboowindchimes.hoalac/" target="_blank" rel="noopener noreferrer" className="w-11 h-11 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity" style={{background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%,#d6249f 60%,#285AEB 90%)'}}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.001 2.002c-5.522 0-9.999 4.477-9.999 9.999 0 4.99 3.656 9.126 8.437 9.879v-6.988h-2.54v-2.891h2.54V9.798c0-2.508 1.493-3.891 3.776-3.891 1.094 0 2.24.195 2.24.195v2.459h-1.264c-1.24 0-1.628.772-1.628 1.563v1.875h2.771l-.443 2.891h-2.328v6.988C18.344 21.129 22 16.992 22 12.001c0-5.522-4.477-9.999-9.999-9.999z"/>
                  </svg>
                </a>
                <div className="flex items-center gap-3">
                  <a href="https://wa.me/84266211366" target="_blank" rel="noopener noreferrer" className="w-11 h-11 bg-[#25D366] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>
                  <div className="flex flex-col -gap-0.5">
                    <span className="font-nunito text-base text-black">Hotline</span>
                    <a href="tel:+84266211366" className="font-nunito text-lg font-medium text-black text-center hover:text-primary transition-colors">
                      0266211366
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default DiscoverHoaLac;
