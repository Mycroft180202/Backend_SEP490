import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../shared/Pagination';
import { BlogService } from '../../services/modules/blog/blogService';

const PAGE_SIZE = 4;

const NewsCard = ({
  image, date, title, onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-4 w-full bg-white rounded-xl border border-[#D4A574]/30 shadow hover:shadow-lg transition overflow-hidden text-left"
    >
      <img
        src={image}
        alt={title}
        className="w-full h-[200px] object-cover"
      />
      <div className="px-4 pb-4 flex flex-col gap-1">
        <span className="font-nunito text-xs text-[#9e211f] font-semibold">{date}</span>
        <h3 className="font-nunito text-lg font-semibold text-gray-800 line-clamp-2">{title}</h3>
      </div>
    </button>
  );
};

const DiscoverHoaLac = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await BlogService.getAll({ pageIndex: 1, pageSize: 20 });
        const items = res?.items || [];
        const published = items.filter((b) => {
          const status = (b.postStatus || '').toString().toLowerCase();
          return status === 'published' || status === 'active';
        });
        setBlogs(published);
      } catch (err) {
        console.error('Load blogs error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPages = Math.max(1, Math.ceil(blogs.length / PAGE_SIZE));
  const display = useMemo(
    () => blogs.slice((pageIndex - 1) * PAGE_SIZE, (pageIndex - 1) * PAGE_SIZE + PAGE_SIZE),
    [blogs, pageIndex],
  );

  return (
    <section className="w-full py-[60px] px-4 md:px-10 lg:px-24 bg-background">
      <div className="max-w-[1440px] mx-auto">
        <h2 className="font-alata text-3xl md:text-4xl text-primary leading-[56px] mb-10">
          Khám phá Hòa Lạc
        </h2>

        <div className="flex flex-col items-center gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                <div key={idx} className="h-[260px] bg-white rounded-xl shadow animate-pulse" />
              ))
              : display.map((item) => {
                const blogId = item.id || item.blogId;
                return (
                  <NewsCard
                    key={blogId || item.title}
                    image={item.image || '/images/default-product.png'}
                    date={new Date(item.updateAt || item.createAt || Date.now()).toLocaleDateString('vi-VN')}
                    title={item.title}
                    onClick={() => blogId && navigate(`/blog/${blogId}`)}
                  />
                );
              })}
          </div>

          {blogs.length > PAGE_SIZE && (
            <div className="mt-4">
              <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={setPageIndex} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DiscoverHoaLac;
