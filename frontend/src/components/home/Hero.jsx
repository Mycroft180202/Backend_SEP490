import React, { useState} from 'react';
import { Link } from "react-router-dom";
import heroBg from '../../assets/images/hero-bg.jpg';
import dragonfly1 from '../../assets/images/dragonfly1.png';
import dragonfly2 from '../../assets/images/dragonfly2.png';
import lantern1 from '../../assets/images/lantern1.png';
import lantern2 from '../../assets/images/lantern2.png';

const Hero = () => {
  return (
    <section className="relative w-full bg-background">
      {/* Hero Section */}
        <div className="relative hero-animation-trigger w-full h-[400px] md:h-[600px] lg:h-[840px] overflow-hidden bg-gradient-to-br from-[#AE4644] to-[#710004]" >
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="w-full h-full" style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.5
          }}></div>
          
          {/* Decorative elements */}
          <div className="absolute top-1/4 left-1/4 w-24 h-24 animate-float">
            <img src={dragonfly1} alt="" className="w-full h-full" />
          </div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 animate-float-delayed">
            <img src={dragonfly2} alt="" className="w-full h-full" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 w-20 h-24 animate-float">
            <img src={lantern1} alt="" className="w-full h-full" />
          </div>
          <div className="absolute bottom-1/3 right-1/4 w-20 h-24 animate-float-delayed">
            <img src={lantern2} alt="" className="w-full h-full" />
          </div>
        </div>

        {/* Initial Content Container - will be hidden after animation */}
        <div 
          className="relative z-10 h-full flex items-start justify-center pt-60 md:pt-60" 
          style={{
            animation: 'fadeOutInitialContent 1s ease-out forwards', 
            animationDelay: '4s'
          }}
        >
          <div className="text-center px-4 max-w-4xl">
            <h2 className="font-alata text-2xl md:text-4xl lg:text-5xl text-white leading-relaxed">
              Nghệ thuật truyền thống Hòa Lạc
            </h2>
            <p className="mt-4 font-nunito text-lg md:text-xl text-white/90">
              Nơi hội tụ tinh hoa của những đôi bàn tay tài hoa
            </p>
          </div>
        </div>

        {/* Initial Content Container - will be hidden after animation */}
        {/* Text behind fans */}
        <div className="absolute inset-0 flex items-center justify-center text-intro z-40">
          <div className="max-w-[1000px] flex flex-col items-center gap-10 px-4">
            <div className="flex flex-col items-center gap-5 text-center">
              <h2 className="font-malko text-[40px] leading-[1.1em] text-white drop-shadow-lg">
                Chào mừng đến với<br />
                Hoa Lac Handicraft Promotion and Sales
              </h2>
              <p className="font-nunito font-semibold text-2xl leading-[1.36em] text-white drop-shadow-lg">
                Bạn có thể khám phá các sản phẩm thủ công truyền thống đặc sắc chỉ có tại Hòa Lạc
              </p>
            </div>
             <Link to="/shop">
               <button className="px-6 py-2.5 bg-[#FBC04C] rounded-xl font-nunito font-semibold text-lg text-black hover:bg-opacity-90 transition-colors">
                 Khám phá
               </button>
             </Link>
          </div>
        </div>

        <div className="absolute -top-[122px] -left-[122px] w-[244px] h-[244px] rounded-full bg-[#761214] blur-[50px]"></div>
        <div className="absolute -top-[122px] right-[-122px] w-[244px] h-[244px] rounded-full bg-[#9E211F] blur-[50px]"></div>

        

        {/* Fans Container */}
        <div className="absolute inset-0 flex justify-center items-center overflow-hidden">
          {/* Left Fan */}
          <div className={`fan-left-container absolute z-20`}
               style={{
                 left: '50%',
                 top: '50%',
                 width: '718px',
                 height: '776px',
                 transform: 'translate(-150%, -50%)',
                 transformOrigin: 'right center'
               }}>
            <svg width="1053" height="840" viewBox="0 0 1053 840" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_left)" filter="url(#filter0_d_left)">
                <path d="M408.263 846.027L255.085 820.187L405.754 831.6L410.047 799.36L254.772 804.361L404.722 785.712L402.579 753.238L251.351 788.861L394.661 740.925L386.098 709.548L244.876 774.408L375.919 699.032L361.362 669.943L235.717 761.472L349.302 661.657L329.264 636.03L224.187 750.594L315.774 630.302L291.063 609.14L210.702 742.217L276.75 606.174L248.379 590.328L195.88 736.671L233.706 590.25L202.752 580.34L180.24 734.179L188.417 583.169L156.094 579.603L164.409 734.867L142.575 585.261L110.18 588.139L149.031 738.659L98.0533 596.324L66.8888 605.58L134.716 745.429L56.6052 615.999L27.8506 631.245L121.956 754.894L19.8052 643.507L-5.33569 664.113L111.388 766.686L-10.7663 677.737L-31.3395 702.923L103.338 780.355L-33.9999 717.331L-49.203 746.11L109.438 799.141C101.543 834.476 122.759 870.072 158.057 879.53C193.354 888.988 230.691 868.129 240.878 832.579L397.701 876.795L408.263 846.027Z" fill="#1F5852"/>
                <path d="M-28.8361 731.889L-14.1604 722.689L-436.699 473.42L-492.376 530.752L-28.8361 731.889Z" fill="#F0BE1D"/>
                <path d="M-14.1602 722.689L-6.65138 694.666L-416.989 399.864L-436.699 473.42L-14.1602 722.689Z" fill="#F9F775"/>
                <path d="M-6.651 694.666L11.7386 685.508L-352.07 353.459L-416.989 399.864L-6.651 694.666Z" fill="#F0BE1D"/>
                <path d="M11.7378 685.507L22.4842 659.304L-311.309 281.815L-352.071 353.459L11.7378 685.507Z" fill="#F9F775"/>
                <path d="M20.4197 664.385L46.3105 654.42L-245.408 256.305L-311.309 281.815L20.4197 664.385Z" fill="#F0BE1D"/>
                <path d="M46.3105 654.42L59.9369 635.079L-191.89 196.53L-245.408 256.305L46.3105 654.42Z" fill="#F9F775"/>
                <path d="M59.937 635.079L82.1001 629.293L-114.599 184.429L-191.89 196.53L58.8806 639.021" fill="#F0BE1D"/>
                <path d="M82.0996 629.293L103.809 618.249L-54.4564 134.839L-114.599 184.429L82.0996 629.293Z" fill="#F9F775"/>
                <path d="M103.809 618.249L130.406 616.924L28.5024 140.207L-54.4565 134.839L103.809 618.249Z" fill="#F0BE1D"/>
                <path d="M130.407 616.924L147.297 606.411L95.2065 104.596L28.5031 140.207L130.407 616.924Z" fill="#F9F775"/>
                <path d="M147.297 606.411L172.669 613.21L174.471 120.201L95.2067 104.596L147.297 606.411Z" fill="#F0BE1D"/>
                <path d="M172.669 613.21L193.704 609.939L247.235 105.685L174.471 120.201L172.669 613.21Z" fill="#F9F775"/>
                <path d="M193.704 609.939L215.891 621.518L319.303 141.194L247.235 105.685L193.704 609.939Z" fill="#F0BE1D"/>
                <path d="M215.89 621.518L237.042 618.735L390.992 138.571L319.303 141.194L215.89 621.518Z" fill="#F9F775"/>
                <path d="M237.043 618.735L255.243 632.063L454.826 183.805L390.993 138.571L237.043 618.735Z" fill="#F0BE1D"/>
                <path d="M255.243 632.063L282.161 639.275L534.179 201.546L454.825 183.805L255.243 632.063Z" fill="#F9F775"/>
                <path d="M282.16 639.275L292.219 660.282L585.102 256.495L534.179 201.546L282.16 639.275Z" fill="#F0BE1D"/>
                <path d="M292.219 660.282L318.441 667.308L656.864 286.039L585.102 256.495L292.219 660.282Z" fill="#F9F775"/>
                <path d="M318.441 667.308L321.58 689.733L698.282 355.302L656.865 286.039L318.441 667.308Z" fill="#F0BE1D"/>
                <path d="M321.58 689.733L347.102 700.3L753.056 402.831L698.282 355.302L321.58 689.733Z" fill="#F9F775"/>
                <path d="M775.105 474.402L753.056 402.831L347.102 700.3L349.53 726.305L775.105 474.402Z" fill="#F0BE1D"/>
                <path d="M364.684 739.728L349.53 726.305L775.105 474.402L825.233 532.162L364.684 739.728Z" fill="#F9F775"/>
                <path d="M369.401 763.984L364.683 739.728L825.233 532.162L835.788 611.716L369.401 763.984Z" fill="#F0BE1D"/>
                <path d="M873.968 679.158L378.191 783.698L369.401 763.985L835.788 611.716L873.968 679.158Z" fill="#F9F775"/>
                <path d="M866.5 755.995L377.581 806.983L378.191 783.698L873.968 679.158L866.5 755.995Z" fill="#F0BE1D"/>
                <path d="M890.087 828.931L379.88 826.366L377.582 806.983L866.501 755.995L890.087 828.931Z" fill="#F9F775"/>
                <path d="M864.194 904.559L372.837 852.65L379.88 826.366L890.087 828.931L864.194 904.559Z" fill="#F0BE1D"/>
                <path d="M875.494 977.932L377.295 874.476L372.837 852.65L864.194 904.559L875.494 977.932Z" fill="#F9F775"/>
              </g>
              <defs>
                <filter id="filter0_d_left" x="-552" y="-60" width="1604.88" height="1129.48" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dx="-12"/>
                  <feGaussianBlur stdDeviation="2"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                </filter>
                <clipPath id="clip0_left">
                  <rect width="1437" height="776" fill="white" transform="translate(-335.156 -56) rotate(15)"/>
                </clipPath>
              </defs>
            </svg>
          </div>

          {/* Right Fan */}
          <div className={`fan-right-container absolute z-20 `}
               style={{
                 left: '50%',
                 top: '50%',
                 width: '718px',
                 height: '776px',
                 transform: 'translate(0%, -50%)',
                 transformOrigin: 'left center'
               }}>
            <svg width="1049" height="840" viewBox="0 0 1053 840" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_d_right)">
                <path d="M644.616 846.027L797.794 820.187L647.124 831.6L642.832 799.36L798.107 804.361L648.157 785.712L650.3 753.238L801.528 788.861L658.218 740.925L666.781 709.548L808.003 774.408L676.96 699.032L691.517 669.943L817.162 761.472L703.577 661.657L723.614 636.03L828.692 750.594L737.105 630.302L761.816 609.14L842.176 742.217L776.129 606.174L804.5 590.328L856.999 736.671L819.172 590.25L850.127 580.34L872.639 734.179L864.461 583.169L896.785 579.603L888.469 734.867L910.304 585.261L942.699 588.139L903.848 738.659L954.826 596.324L985.99 605.58L918.163 745.429L996.274 615.999L1025.03 631.245L930.923 754.894L1033.07 643.507L1058.21 664.113L941.491 766.686L1063.65 677.737L1084.22 702.923L949.541 780.355L1086.88 717.331L1102.08 746.11L943.441 799.141C951.336 834.476 930.12 870.072 894.822 879.53C859.525 888.988 822.188 868.129 812 832.579L655.178 876.795L644.616 846.027Z" fill="#1F5852"/>
                <path d="M1081.72 731.889L1067.04 722.689L1489.58 473.42L1545.26 530.752L1081.72 731.889Z" fill="#F9F775"/>
                <path d="M1067.04 722.689L1059.53 694.666L1469.87 399.864L1489.58 473.42L1067.04 722.689Z" fill="#F0BE1D"/>
                <path d="M1059.53 694.666L1041.14 685.508L1404.95 353.459L1469.87 399.864L1059.53 694.666Z" fill="#F9F775"/>
                <path d="M1041.14 685.507L1030.39 659.304L1364.19 281.815L1404.95 353.459L1041.14 685.507Z" fill="#F0BE1D"/>
                <path d="M1032.46 664.385L1006.57 654.42L1298.29 256.305L1364.19 281.815L1032.46 664.385Z" fill="#F9F775"/>
                <path d="M1006.57 654.42L992.942 635.079L1244.77 196.53L1298.29 256.305L1006.57 654.42Z" fill="#F0BE1D"/>
                <path d="M992.942 635.079L970.779 629.293L1167.48 184.429L1244.77 196.53L993.998 639.021" fill="#F9F775"/>
                <path d="M970.778 629.293L949.069 618.249L1107.33 134.839L1167.48 184.429L970.778 629.293Z" fill="#F0BE1D"/>
                <path d="M949.07 618.249L922.473 616.924L1024.38 140.207L1107.34 134.839L949.07 618.249Z" fill="#F9F775"/>
                <path d="M922.472 616.924L905.582 606.411L957.672 104.596L1024.38 140.207L922.472 616.924Z" fill="#F0BE1D"/>
                <path d="M905.582 606.411L880.209 613.21L878.408 120.201L957.672 104.596L905.582 606.411Z" fill="#F9F775"/>
                <path d="M880.21 613.21L859.175 609.939L805.644 105.685L878.408 120.201L880.21 613.21Z" fill="#F0BE1D"/>
                <path d="M859.175 609.939L836.988 621.518L733.576 141.194L805.644 105.685L859.175 609.939Z" fill="#F9F775"/>
                <path d="M836.989 621.518L815.837 618.735L661.887 138.571L733.576 141.194L836.989 621.518Z" fill="#F0BE1D"/>
                <path d="M815.836 618.735L797.635 632.063L598.053 183.805L661.886 138.571L815.836 618.735Z" fill="#F9F775"/>
                <path d="M797.636 632.063L770.718 639.275L518.7 201.546L598.054 183.805L797.636 632.063Z" fill="#F0BE1D"/>
                <path d="M770.719 639.275L760.66 660.282L467.777 256.495L518.7 201.546L770.719 639.275Z" fill="#F9F775"/>
                <path d="M760.66 660.282L734.438 667.308L396.015 286.039L467.777 256.495L760.66 660.282Z" fill="#F0BE1D"/>
                <path d="M734.438 667.308L731.299 689.733L354.597 355.302L396.014 286.039L734.438 667.308Z" fill="#F9F775"/>
                <path d="M731.299 689.733L705.777 700.3L299.823 402.831L354.597 355.302L731.299 689.733Z" fill="#F0BE1D"/>
                <path d="M277.774 474.402L299.823 402.831L705.777 700.3L703.349 726.305L277.774 474.402Z" fill="#F9F775"/>
                <path d="M688.195 739.728L703.349 726.305L277.774 474.402L227.646 532.162L688.195 739.728Z" fill="#F0BE1D"/>
                <path d="M683.478 763.984L688.195 739.728L227.646 532.162L217.091 611.716L683.478 763.984Z" fill="#F9F775"/>
                <path d="M178.911 679.158L674.687 783.698L683.478 763.985L217.091 611.716L178.911 679.158Z" fill="#F0BE1D"/>
                <path d="M186.379 755.995L675.298 806.983L674.688 783.698L178.911 679.158L186.379 755.995Z" fill="#F9F775"/>
                <path d="M162.792 828.931L672.999 826.366L675.297 806.983L186.378 755.995L162.792 828.931Z" fill="#F0BE1D"/>
                <path d="M188.685 904.559L680.042 852.65L672.999 826.366L162.792 828.931L188.685 904.559Z" fill="#F9F775"/>
                <path d="M177.385 977.932L675.584 874.476L680.042 852.65L188.685 904.559L177.385 977.932Z" fill="#F0BE1D"/>
              </g>
              <defs>
                <filter id="filter0_d_right" x="-16" y="-60" width="1604.88" height="1129.48" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dx="-12"/>
                  <feGaussianBlur stdDeviation="2"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                </filter>
              </defs>
            </svg>
          </div>
        </div>

        <style>{`
          @keyframes foldLeft {
          from {
          transform: translate(-150%, -50%) rotate(0deg);
          opacity: 1;
          }
          to {
          transform: translate(-200%, -50%) rotate(25deg);
          opacity: 0;
            }
          }

          @keyframes foldRight {
            from {
              transform: translate(0%, -50%) rotate(0deg);
              opacity: 1;
            }
            to {
              transform: translate(50%, -50%) rotate(-25deg);
              opacity: 0;
            }
          }
          

          @keyframes fadeInText {
            0% {
              opacity: 0;
              transform: scale(0.95);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes fadeOutInitialContent {
            0% {
              opacity: 1;
              transform: scale(1);
            }
            100% {
              opacity: 0;
              transform: scale(0.95);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          @keyframes float-delayed {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          .fan-left-container {
          animation: foldLeft 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 5s; 
          }

          .fan-right-container {
            animation: foldRight 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            animation-delay: 5s; 
          }
         

          .text-intro {
            animation: fadeInText 2s ease-out forwards;
            animation-delay: 5s;
            opacity: 0;
          }

          .animate-float {
            animation: float 3s ease-in-out infinite;
          }

          .animate-float-delayed {
            animation: float-delayed 3s ease-in-out infinite;
            animation-delay: 1.5s;
          }
        `}</style>
      </div>

      {/* Introductory text section with decorative wave elements */}
      <div
       className="relative w-full -mt-[200px] md:-mt-[100px] lg:-mt-[100px] z-30"
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
    </section>
  );
};

export default Hero;
