import React, { useEffect, useState } from 'react';
import { SECTION_TITLE_CLASS, SECTION_SUBTITLE_CLASS } from '../../utils/homeTheme';
import slideOneImg from '../../assets/images/products/Slide1.jpg';
import slideTwoImg from '../../assets/images/products/slide2.jpg';
import slideThreeImg from '../../assets/images/products/slide3.jpg';

const slides = [
  {
    title: 'Khám phá làng nghề',
    subtitle: 'Tinh hoa thủ công Việt',
    content: 'Mỗi sản phẩm là câu chuyện về bàn tay nghệ nhân, về những giá trị truyền thống được gìn giữ và sáng tạo.',
    image: slideOneImg,
  },
  {
    title: 'Kết nối thợ thủ công',
    subtitle: 'Từ bàn tay đến trái tim',
    content: 'Gặp gỡ những người thợ tài hoa, mang sản phẩm thủ công đến gần hơn với cuộc sống hiện đại.',
    image: slideTwoImg,
  },
  {
    title: 'Bảo tồn và phát triển',
    subtitle: 'Di sản sống động',
    content: 'Cùng tiếp sức để làng nghề phát triển bền vững, đưa sản phẩm thủ công Việt vươn xa thế giới.',
    image: slideThreeImg,
  },
];

const ArtisanCraft = () => {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative overflow-hidden bg-[#FFF6E9] pt-20 pb-24">

      <div className="relative max-w-6xl mx-auto px-4 md:px-10 lg:px-16">
        <div className="text-center space-y-4">
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/70 text-[#8B4513] text-xs font-semibold tracking-[0.25em] uppercase">
            Hành trình làng nghề
          </span>
          <h2 className={SECTION_TITLE_CLASS}>Không gian nghệ nhân Hòa Lạc</h2>
          <p className={`${SECTION_SUBTITLE_CLASS} max-w-3xl mx-auto`}>
            Dõi theo nhịp sống của những nghệ nhân, nơi từng đường khắc và nét vẽ đều được nâng niu để giữ trọn tinh hoa truyền thống.
          </p>
        </div>

        <div className="relative mt-12">
          <div className="relative h-[440px] md:h-[520px] lg:h-[620px] rounded-[36px] border border-[#D4A574]/40 shadow-[0_32px_70px_-30px_rgba(97,43,0,0.15)] overflow-hidden bg-[#FFF6E9]">
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="flex h-full transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
                style={{ transform: `translateX(-${current * 100}%)` }}
              >
                {slides.map((item) => (
                  <div key={item.title} className="relative w-full h-full shrink-0">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `linear-gradient(270deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%), url('${item.image}')`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/60" />
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 h-full flex items-center justify-center">
              <div className="max-w-xl w-full bg-white/80 text-[#1C355E] backdrop-blur-md rounded-3xl px-6 sm:px-10 py-10 space-y-4 shadow-[0_30px_60px_rgba(248,215,171,0.45)] border border-white/60">
                <h3 className="font-nunito text-3xl md:text-4xl leading-snug font-bold">
                  {slide.title}
                </h3>
                <p className="text-lg md:text-xl font-semibold text-[#C2762B]">{slide.subtitle}</p>
                <p className="text-sm md:text-base leading-relaxed text-[#2E3C57]">{slide.content}</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-12 h-[3px] rounded-full bg-[#C2762B]" />
                  <span className="text-xs uppercase tracking-[0.2em] text-[#9E211F]/80">Truyền thống & Hiện đại</span>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 1440 658" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="artisan-gradient" x1="720" y1="329" x2="-229" y2="329" gradientUnits="userSpaceOnUse">
                    <stop stopOpacity="0" />
                    <stop offset="1" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <path d="M720.5 0C910.265 0 1069.43 18.8289 1112.51 44.1992C1152.77 28.908 1258.01 18 1381.5 18C1539.73 18 1668 35.9086 1668 58C1668 77.2924 1570.17 93.3934 1440 97.1641V560.835C1570.17 564.606 1668 580.708 1668 600C1668 622.091 1539.73 640 1381.5 640C1258.01 640 1152.77 629.091 1112.51 613.8C1069.43 639.17 910.265 658 720.5 658C529.565 658 369.604 638.937 327.707 613.329C288.384 628.867 182.254 640 57.5 640C-100.73 640 -229 622.091 -229 600C-229 580.658 -130.673 564.523 0 560.806V97.1934C-130.673 93.4764 -229 77.3418 -229 58C-229 35.9086 -100.73 18 57.5 18C182.254 18 288.384 29.1321 327.707 44.6699C369.605 19.0625 529.565 0 720.5 0Z" fill="url(#artisan-gradient)" fillOpacity="0.18" />
              </svg>
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrent(idx)}
                  className={`w-3 h-3 rounded-full transition ${current === idx ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArtisanCraft;
