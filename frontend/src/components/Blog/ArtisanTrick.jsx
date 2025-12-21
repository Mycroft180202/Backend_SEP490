import React, { useState } from 'react';

const ArtisanTrick = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Sample blog data
  const blogs = [
    {
      id: 1,
      image: '/images/blog1.jpg',
      date: '22-09-2025',
      title: 'Chuồn chuồn tre được tạo ra như thế nào?'
    },
    {
      id: 2,
      image: '/images/blog2.jpg',
      date: '22-09-2025',
      title: 'Chuồn chuồn tre được tạo ra như thế nào?'
    },
    {
      id: 3,
      image: '/images/blog3.jpg',
      date: '22-09-2025',
      title: 'Chuồn chuồn tre được tạo ra như thế nào?'
    },
    {
      id: 4,
      image: '/images/blog1.jpg',
      date: '23-09-2025',
      title: 'Nghệ thuật đan lát truyền thống'
    },
    {
      id: 5,
      image: '/images/blog2.jpg',
      date: '23-09-2025',
      title: 'Bí quyết bảo quản đồ thủ công'
    },
    {
      id: 6,
      image: '/images/blog3.jpg',
      date: '23-09-2025',
      title: 'Xu hướng mới trong làng nghề'
    }
  ];

  const totalPages = Math.ceil(blogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBlogs = blogs.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-full py-12 md:py-20 lg:py-[120px] px-4 md:px-10 lg:px-36 bg-[#FFFBF0]">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <h2 className="text-3xl font-bold text-red-600 mb-8">
          Mẹo vặt hay với đồ thủ công
        </h2>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentBlogs.map((blog) => (
            <div 
              key={blog.id} 
              className="group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              {/* Blog Image */}
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={blog.image} 
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Blog Content */}
              <div className="p-4 bg-white">
                <p className="text-sm text-gray-500 mb-2">{blog.date}</p>
                <h3 className="text-lg font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                  {blog.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Trước
          </button>
          
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 rounded ${
                currentPage === index + 1
                  ? 'bg-red-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-100'
              }`}
            >
              {index + 1}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtisanTrick;