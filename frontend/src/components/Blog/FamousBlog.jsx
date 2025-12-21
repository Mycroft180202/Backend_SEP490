import React from 'react';

const BlogCard = ({ image, date, title, isLarge }) => {
  return (
    <div 
      className={`relative rounded-lg overflow-hidden cursor-pointer group ${
        isLarge ? 'h-[400px]' : 'h-[190px]'
      }`}
    >
      <img 
        src={image} 
        alt={title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
        <p className="font-nunito text-sm md:text-base mb-2 opacity-90">{date}</p>
        <h3 className={`font-nunito ${isLarge ? 'text-lg md:text-xl' : 'text-base'} font-semibold leading-snug`}>
          {title}
        </h3>
      </div>
    </div>
  );
};

const FamousBlog = () => {
  const blogs = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1582721478779-0ae163c05a60?w=800',
      date: '17-10-2025',
      title: 'Khám phá cách nghệ nhân tạo ra các sản phẩm mây tre đan',
      isLarge: true
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1565191999001-551c187427bb?w=400',
      date: '17-10-2025',
      title: 'Khám phá cách nghệ nhân tạo ra các sản phẩm mây tre đan',
      isLarge: false
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1565191999001-551c187427bb?w=400',
      date: '12-10-2025',
      title: 'Khám phá cách nghệ nhân tạo ra các sản phẩm mây tre đan',
      isLarge: false
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1565191999001-551c187427bb?w=400',
      date: '12-10-2025',
      title: 'Khám phá cách nghệ nhân tạo ra các sản phẩm mây tre đan',
      isLarge: false
    }
  ];

  return (
    <section className="w-full py-12 md:py-20 lg:py-[120px] px-4 md:px-10 lg:px-36 bg-[#FFFBF0]">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="font-alata text-2xl md:text-3xl lg:text-4xl text-[#8B4513] mb-8 md:mb-12">
          Tin tức nổi bật
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Large card - Left side */}
          <div>
            <BlogCard {...blogs[0]} />
          </div>

          {/* Small cards - Right side */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6">
            <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 md:space-y-0 lg:space-y-0">
              <BlogCard {...blogs[1]} />
              <BlogCard {...blogs[2]} />
            </div>
            <BlogCard {...blogs[3]} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FamousBlog;