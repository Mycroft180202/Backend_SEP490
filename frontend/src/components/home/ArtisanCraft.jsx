import React, { useState } from 'react';

const slides = [
  {
    title: 'Khám phá làng nghề',
    subtitle: 'Tinh hoa thủ công Việt',
    content: 'Mỗi sản phẩm là câu chuyện về bàn tay nghệ nhân, về những giá trị truyền thống được gìn giữ và sáng tạo.',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600',
  },
  {
    title: 'Kết nối thợ thủ công',
    subtitle: 'Từ bàn tay đến trái tim',
    content: 'Gặp gỡ những người thợ tài hoa, mang sản phẩm thủ công đến gần hơn với cuộc sống hiện đại.',
    image: 'https://images.unsplash.com/photo-1523419400524-c4014d575100?w=1600',
  },
  {
    title: 'Bảo tồn và phát triển',
    subtitle: 'Di sản sống động',
    content: 'Cùng tiếp sức để làng nghề phát triển bền vững, đưa sản phẩm thủ công Việt vươn xa thế giới.',
    image: 'https://images.unsplash.com/photo-1505491036773-ff225c9c40b9?w=1600',
  },
];

const ArtisanCraft = () => {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[current];

  return (
    <section className="relative w-full overflow-hidden">
      <div
        className="relative h-[420px] md:h-[520px] lg:h-[640px] transition-all duration-700"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(270deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%), url('${slide.image}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/50" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-10 lg:px-16 h-full flex items-center">
          <div className="max-w-2xl text-white space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">Artisan Craft</p>
            <h2 className="font-alata text-3xl md:text-4xl lg:text-5xl leading-tight">
              {slide.title}
            </h2>
            <p className="text-lg md:text-xl font-semibold text-[#FFD7A0]">{slide.subtitle}</p>
            <p className="text-sm md:text-base leading-relaxed text-white/90">{slide.content}</p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-1 rounded-full bg-[#FFD7A0]" />
              <span className="text-xs uppercase tracking-wide text-white/70">Truyền thống & Hiện đại</span>
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
            <path d="M720.5 0C910.265 0 1069.43 18.8289 1112.51 44.1992C1152.77 28.908 1258.01 18 1381.5 18C1539.73 18 1668 35.9086 1668 58C1668 77.2924 1570.17 93.3934 1440 97.1641V560.835C1570.17 564.606 1668 580.708 1668 600C1668 622.091 1539.73 640 1381.5 640C1258.01 640 1152.77 629.091 1112.51 613.8C1069.43 639.17 910.265 658 720.5 658C529.565 658 369.604 638.937 327.707 613.329C288.384 628.867 182.254 640 57.5 640C-100.73 640 -229 622.091 -229 600C-229 580.658 -130.673 564.523 0 560.806V97.1934C-130.673 93.4764 -229 77.3418 -229 58C-229 35.9086 -100.73 18 57.5 18C182.254 18 288.384 29.1321 327.707 44.6699C369.605 19.0625 529.565 0 720.5 0Z" fill="url(#artisan-gradient)" fillOpacity="0.15" />
          </svg>
        </div>

        <div className="absolute inset-0 flex items-center justify-between px-4 md:px-8">
          <button
            type="button"
            onClick={prevSlide}
            className="p-3 rounded-full bg-white text-[#8B4513] shadow-lg transition hover:-translate-x-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="p-3 rounded-full bg-white text-[#8B4513] shadow-lg transition hover:translate-x-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
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
    </section>
  );
};

export default ArtisanCraft;
