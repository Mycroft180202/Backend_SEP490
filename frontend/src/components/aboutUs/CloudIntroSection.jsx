import React from 'react';

const CloudIntroSection = ({ assets }) => (
  <div
       className="relative w-full -mt-[100px] md:-mt-[1500px] lg:-mt-[50px] z-30"
       >
        {/* Container for all wave decorations */}
        <div className="relative w-full" style={{ height: '445px' }}>

          {/* Dark blue circles creating top wave edge - behind everything */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-0" style={{ width: '2600px', height: '161px' }}>
            {[...Array(16)].map((_, i) => (
              <div key={`dark-${i}`} className="w-40 h-40 rounded-full bg-[#1C355E] -mx-1" />
            ))}
          </div>

          {/* Main content background with green circles wave */}
          <div className="absolute top-[15px] left-0 right-0" style={{ height: '430px' }}>
            {/* Light green background rectangle */}
            <div className="absolute top-[72px] left-0 right-0 h-[300px] bg-[#DBEFE2]" />

            {/* Light green circles creating top wave */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-0" style={{ width: '2600px', height: '161px' }}>
              {[...Array(16)].map((_, i) => (
                <div key={`light-${i}`} className="w-40 h-40 rounded-full bg-[#DBEFE2] -mx-1" />
              ))}
            </div>

            {/* Bottom wave ellipses */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0">
              {/* Left ellipse */}
              <div className="absolute left-[57px] bottom-0 w-[573px] h-20 rounded-full bg-[#DBEFE2]" style={{ borderRadius: '50%' }} />

              {/* Center ellipse (larger) */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[807px] h-[116px] rounded-full bg-[#DBEFE2]" style={{ borderRadius: '50%' }} />

              {/* Right ellipse */}
              <div className="absolute right-[57px] bottom-0 w-[573px] h-20 rounded-full bg-[#DBEFE2]" style={{ borderRadius: '50%' }} />
            </div>
          </div>

          {/* Content container */}
          <div className="relative z-10 max-w-[1576px] mx-auto px-4 md:px-8 lg:px-[161px]" style={{ paddingTop: '140px' }}>

            {/* Decorative swirl left */}
            <div className="absolute left-0 lg:left-4 top-[140px]">
              <svg width="247" height="70" viewBox="0 0 247 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_swirl_left)">
                  <path d="M230.85 0H79.5701C79.5701 0 35.2201 1.58 32.8401 23.76C30.4601 45.94 45.5101 49.1 72.4401 48.31C99.3701 47.52 129.28 47.87 133.43 49.89C137.21 51.74 142.93 60.19 127.89 60.98C112.84 61.77 -66.9499 61.77 -67.7399 64.15C-68.5299 66.53 -68.1699 67.37 -57.0799 68.17C-45.9899 68.96 175.41 70.49 187.29 68.91C199.17 67.33 211.84 60.2 207.09 42.77C203.14 28.27 136.6 30.1 123.14 30.89C109.68 31.68 108.09 10.3 125.52 7.92C142.94 5.54 245.91 6.34 245.91 6.34C245.91 6.34 249.87 2.38 230.86 0L230.85 0Z" fill="url(#paint0_linear_swirl)" style={{mixBlendMode: 'screen'}}/>
                </g>
                <defs>
                  <linearGradient id="paint0_linear_swirl" x1="26.749" y1="114.886" x2="151.081" y2="-9.44606" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9E211F"/>
                    <stop offset="1" stopColor="#F0BE1D"/>
                  </linearGradient>
                  <clipPath id="clip0_swirl_left">
                    <rect width="314.24" height="69.6" fill="white" transform="translate(-68)"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
              
            {/* Main text content */}
            <div className="max-w-[956px] mx-auto text-center relative" style={{ paddingTop: '29px' }}>
              <h2 className="font-alata text-base md:text-xl lg:text-2xl text-black leading-relaxed md:leading-[48px]">
                Hòa Lạc – không chỉ là một địa danh, mà còn là nơi hội tụ tinh hoa của những đôi bàn tay tài hoa, nơi mỗi thớ gỗ, sợi tre, hay mảnh gốm đều được thổi hồn, mang theo câu chuyện của người nghệ nhân và văn hóa truyền thống.
              </h2>
            </div>

            {/* Decorative swirl right */}
            <div className="absolute right-0 lg:right-4 bottom-0" style={{ top: '273px' }}>
              <svg width="246" height="70" viewBox="0 0 246 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_swirl_right)">
                  <path d="M15.3902 0H166.67C166.67 0 211.02 1.58 213.4 23.76C215.78 45.94 200.73 49.1 173.8 48.31C146.87 47.52 116.96 47.87 112.81 49.89C109.03 51.74 103.31 60.19 118.35 60.98C133.4 61.77 313.19 61.77 313.98 64.15C314.77 66.53 314.41 67.37 303.32 68.17C292.23 68.96 70.8302 70.49 58.9502 68.91C47.0702 67.33 34.4002 60.2 39.1502 42.77C43.1002 28.27 109.64 30.1 123.1 30.89C136.56 31.68 138.15 10.3 120.72 7.92C103.3 5.54 0.33017 6.34 0.33017 6.34C0.33017 6.34 -3.62982 2.38 15.3802 0L15.3902 0Z" fill="url(#paint0_linear_swirl_right)" style={{mixBlendMode: 'screen'}}/>
                </g>
                <defs>
                  <linearGradient id="paint0_linear_swirl_right" x1="219.491" y1="114.886" x2="95.1591" y2="-9.44606" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9E211F"/>
                    <stop offset="1" stopColor="#F0BE1D"/>
                  </linearGradient>
                  <clipPath id="clip0_swirl_right">
                    <rect width="314.24" height="69.6" fill="white" transform="matrix(-1 0 0 1 314.24 0)"/>
                  </clipPath>
                </defs>
              </svg>
            </div>

          </div>
        </div>
        </div>
);

export default CloudIntroSection;
