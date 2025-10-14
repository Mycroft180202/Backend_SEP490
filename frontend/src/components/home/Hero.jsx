import React from 'react';

const Hero = () => {
  return (
    <section className="relative w-full bg-background">
      {/* Header positioned absolutely */}
      <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center py-5 px-4 md:px-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-gray-300"></div>
          <h1 className="font-alata text-lg md:text-xl text-white">Hoa Lac Handicraft</h1>
        </div>

        <nav className="hidden lg:flex items-center gap-6">
          <a href="/" className="font-nunito text-lg text-white hover:opacity-80">Trang chủ</a>
          <a href="/about" className="font-nunito text-lg text-white hover:opacity-80">Về chúng tôi</a>
          <a href="/shop" className="font-nunito text-lg text-white hover:opacity-80">Cửa hàng</a>
          <a href="/blog" className="font-nunito text-lg text-white hover:opacity-80">Blog</a>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="w-5 h-5 md:w-6 md:h-6 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="w-5 h-5 md:w-6 md:h-6 text-white hidden md:block">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="w-5 h-5 md:w-6 md:h-6 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          <button className="hidden md:block px-4 lg:px-6 py-1 lg:py-1.5 border-0.5 border-white rounded-xl font-nunito text-base lg:text-lg font-medium text-white hover:bg-white hover:bg-opacity-10 transition-colors">
            Đăng nhập
          </button>
        </div>
      </header>

      {/* Fan decorative background */}
      <div className="relative w-full h-[400px] md:h-[600px] lg:h-[840px] overflow-hidden">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/f29584585f02bf088f24b4909bba22550a09c557?width=2880"
          alt="Decorative fan background"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </div>

      {/* Introductory text section with decorative elements */}
      <div className="relative w-full py-12 md:py-20 lg:py-[120px] bg-background overflow-hidden">
        {/* Decorative wave backgrounds */}
        <div className="absolute top-0 left-0 right-0 h-[161px] flex">
          <div className="w-20 h-20 rounded-full bg-[#1C355E]"></div>
          <div className="w-20 h-20 rounded-full bg-[#1C355E] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#1C355E] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#1C355E] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#1C355E] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#1C355E] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#1C355E] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#1C355E] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#1C355E] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#1C355E] -ml-1"></div>
        </div>

        <div className="absolute top-[15px] left-0 right-0 h-[430px] bg-[#DBEFE2]"></div>

        {/* Wave pattern top */}
        <div className="absolute top-[15px] left-0 right-0 h-[161px] flex">
          <div className="w-20 h-20 rounded-full bg-[#DBEFE2]"></div>
          <div className="w-20 h-20 rounded-full bg-[#DBEFE2] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#DBEFE2] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#DBEFE2] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#DBEFE2] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#DBEFE2] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#DBEFE2] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#DBEFE2] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#DBEFE2] -ml-1"></div>
          <div className="w-20 h-20 rounded-full bg-[#DBEFE2] -ml-1"></div>
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-20 lg:px-36 pt-10 md:pt-20 lg:pt-[140px] pb-10">
          {/* Decorative swirl left */}
          <div className="absolute left-0 top-0">
            <svg width="247" height="70" viewBox="0 0 247 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M230.85 0H79.5701C79.5701 0 35.2201 1.58 32.8401 23.76C30.4601 45.94 45.5101 49.1 72.4401 48.31C99.3701 47.52 129.28 47.87 133.43 49.89C137.21 51.74 142.93 60.19 127.89 60.98C112.84 61.77 -66.9499 61.77 -67.7399 64.15C-68.5299 66.53 -68.1699 67.37 -57.0799 68.17C-45.9899 68.96 175.41 70.49 187.29 68.91C199.17 67.33 211.84 60.2 207.09 42.77C203.14 28.27 136.6 30.1 123.14 30.89C109.68 31.68 108.09 10.3 125.52 7.92C142.94 5.54 245.91 6.34 245.91 6.34C245.91 6.34 249.87 2.38 230.86 0L230.85 0Z" fill="url(#paint0_linear)" style={{mixBlendMode: 'screen'}}/>
              <defs>
                <linearGradient id="paint0_linear" x1="26.749" y1="114.886" x2="151.081" y2="-9.44606" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#9E211F"/>
                  <stop offset="1" stopColor="#F0BE1D"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="max-w-[956px] mx-auto text-center">
            <h2 className="font-alata text-lg md:text-xl lg:text-2xl text-black leading-relaxed md:leading-[48px]">
              Hòa Lạc – không chỉ là một địa danh, mà còn là nơi hội tụ tinh hoa của những đôi bàn tay tài hoa, nơi mỗi thớ gỗ, sợi tre, hay mảnh gốm đều được thổi hồn, mang theo câu chuyện của người nghệ nhân và văn hóa truyền thống.
            </h2>
          </div>

          {/* Decorative swirl right */}
          <div className="absolute right-0 bottom-0">
            <svg width="246" height="70" viewBox="0 0 246 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.3902 0H166.67C166.67 0 211.02 1.58 213.4 23.76C215.78 45.94 200.73 49.1 173.8 48.31C146.87 47.52 116.96 47.87 112.81 49.89C109.03 51.74 103.31 60.19 118.35 60.98C133.4 61.77 313.19 61.77 313.98 64.15C314.77 66.53 314.41 67.37 303.32 68.17C292.23 68.96 70.8302 70.49 58.9502 68.91C47.0702 67.33 34.4002 60.2 39.1502 42.77C43.1002 28.27 109.64 30.1 123.1 30.89C136.56 31.68 138.15 10.3 120.72 7.92C103.3 5.54 0.33017 6.34 0.33017 6.34C0.33017 6.34 -3.62982 2.38 15.3802 0L15.3902 0Z" fill="url(#paint1_linear)" style={{mixBlendMode: 'screen'}}/>
              <defs>
                <linearGradient id="paint1_linear" x1="219.491" y1="114.886" x2="95.1591" y2="-9.44606" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#9E211F"/>
                  <stop offset="1" stopColor="#F0BE1D"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
