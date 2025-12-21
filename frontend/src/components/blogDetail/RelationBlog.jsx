import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

const RelationBlog = ({ blogs = [] }) => {
  // Default blogs if none provided
  const defaultBlogs = [
    {
      id: 2,
      title: 'Bí quyết chọn sản phẩm mây tre chất lượng',
      image: 'https://images.unsplash.com/photo-1565191999001-551c187427bb?w=400',
      date: '15-10-2025'
    },
    {
      id: 3,
      title: 'Top 10 sản phẩm mây tre được ưa chuộng nhất',
      image: 'https://images.unsplash.com/photo-1582721478779-0ae163c05a60?w=400',
      date: '12-10-2025'
    },
    {
      id: 4,
      title: 'Cách bảo quản đồ mây tre bền đẹp',
      image: 'https://images.unsplash.com/photo-1565191999001-551c187427bb?w=400',
      date: '10-10-2025'
    }
  ];

  const relatedBlogs = blogs.length > 0 ? blogs : defaultBlogs;

  return (
    <div className="bg-white py-12 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="font-alata text-2xl md:text-3xl lg:text-4xl text-[#8B4513] mb-8">
          Bài viết liên quan
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedBlogs.map((blog) => (
            <div 
              key={blog.id}
              className="group cursor-pointer"
            >
              <div className="relative h-64 rounded-lg overflow-hidden mb-4">
                <img 
                  src={blog.image} 
                  alt={blog.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                <FaCalendarAlt className="text-[#8B4513]" />
                <span>{blog.date}</span>
              </div>
              <h3 className="font-nunito text-lg font-semibold text-gray-800 group-hover:text-[#8B4513] transition-colors line-clamp-2">
                {blog.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RelationBlog;
