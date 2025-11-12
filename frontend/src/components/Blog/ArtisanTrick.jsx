import React, { useEffect, useMemo, useState } from 'react';
import { BlogService } from '../../services/modules/blog/blogService';

const DEFAULT_IMAGE = 'https://via.placeholder.com/600x400?text=Blog';
const LOCAL_PAGE_SIZE = 3;
const FETCH_SIZE = 30;

const formatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('vi-VN');
};

const ArtisanTrick = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let ignore = false;
    const loadBlogs = async () => {
      try {
        setLoading(true);
        const response = await BlogService.getAll({ pageIndex: 1, pageSize: FETCH_SIZE });
        if (!ignore) {
          const items = (response.items || []).filter(
            (blog) => (blog.postStatus || '').toLowerCase() === 'active',
          );
          setBlogs(items);
        }
      } catch (error) {
        console.error('Failed to fetch artisan tips', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadBlogs();
    return () => { ignore = true; };
  }, []);

  const totalPages = Math.max(1, Math.ceil(blogs.length / LOCAL_PAGE_SIZE));
  const currentBlogs = useMemo(() => {
    const start = (currentPage - 1) * LOCAL_PAGE_SIZE;
    return blogs.slice(start, start + LOCAL_PAGE_SIZE);
  }, [blogs, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-full py-12 md:py-20 lg:py-[120px] px-4 md:px-10 lg:px-36 bg-[#FFFBF0]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-red-600 mb-8">
          Meo vat thu cong
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">Dang tai cac meo hay...</p>
        ) : currentBlogs.length === 0 ? (
          <p className="text-center text-gray-500">Chua co meo nao duoc dang.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentBlogs.map((blog) => (
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
                    <h3 className="text-lg font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Truoc
              </button>
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={`artisan-page-${index + 1}`}
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
          </>
        )}
      </div>
    </div>
  );
};

export default ArtisanTrick;
