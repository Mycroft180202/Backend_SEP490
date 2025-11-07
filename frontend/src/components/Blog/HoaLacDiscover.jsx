import Pagination from '@mui/material/Pagination';
import React, { useState } from 'react';

const HoaLacDiscover = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;

  // Sample blog data
  const blogs = [
    {
      id: 1,
      image: '/images/blog1.jpg', // Replace with actual image path
      date: '22-09-2025',
      title: 'Chuồn chuồn tre được tạo ra như thế nào?'
    },
    {
      id: 2,
      image: '/images/blog2.jpg', // Replace with actual image path
      date: '22-09-2025',
      title: 'Chuồn chuồn tre được tạo ra như thế nào?'
    },
    {
      id: 3,
      image: '/images/blog3.jpg', // Replace with actual image path
      date: '22-09-2025',
      title: 'Chuồn chuồn tre được tạo ra như thế nào?'
    }
  ];

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-800 mb-8">
        Khám phá Hòa Lạc
      </h2>

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {blogs.map((blog) => (
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
      <div className="flex justify-center">
        <Pagination count={totalPages} page={currentPage} onChange={(event, page) => handlePageChange(page)} />
      </div>
    </div>
  );
};

export default HoaLacDiscover;