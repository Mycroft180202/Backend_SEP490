import Pagination from '@mui/material/Pagination';
import React, { useEffect, useState } from 'react';
import { BlogService } from '../../services/modules/blog/blogService';

const DEFAULT_IMAGE = 'https://via.placeholder.com/600x400?text=Blog';
const PAGE_SIZE = 6;

const formatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('vi-VN');
};

const HoaLacDiscover = () => {
  const [blogs, setBlogs] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const loadBlogs = async () => {
      try {
        setLoading(true);
        const response = await BlogService.getAll({ pageIndex, pageSize: PAGE_SIZE });
        if (!ignore) {
          const items = (response.items || []).filter(
            (blog) => (blog.postStatus || '').toLowerCase() === 'active',
          );
          setBlogs(items);
          setTotalPages(response.totalPages || 1);
        }
      } catch (error) {
        console.error('Failed to fetch blogs for Hoa Lac Discover', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadBlogs();
    return () => { ignore = true; };
  }, [pageIndex]);

  return (
    <div className="w-full py-12 md:py-20 lg:py-[120px] px-4 md:px-10 lg:px-36 bg-[#FFFBF0]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Kham pha Hoa Lac</h2>

        {loading ? (
          <p className="text-center text-gray-500">Dang tai cac bai viet...</p>
        ) : blogs.length === 0 ? (
          <p className="text-center text-gray-500">Chua co bai viet nao.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {blogs.map((blog) => (
                <div
                  key={`${blog.title}-${blog.publishedAt}`}
                  className="group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={blog.image || DEFAULT_IMAGE}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-4 bg-white">
                    <p className="text-sm text-gray-500 mb-2">{formatDate(blog.publishedAt)}</p>
                    <h3 className="text-lg font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                      {blog.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <Pagination
                count={Math.max(totalPages, 1)}
                page={pageIndex}
                onChange={(_, value) => setPageIndex(value)}
                color="primary"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HoaLacDiscover;
