import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../shared/Pagination';
import { BlogService } from '../../services/modules/blog/blogService';
import { SECTION_TITLE_CLASS, SECTION_SUBTITLE_CLASS, PRIMARY_BUTTON_CLASS } from '../../utils/homeTheme';

const PAGE_SIZE = 4;

const NewsCard = ({
  image, date, title, onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col w-full overflow-hidden rounded-3xl border border-[#D4A574]/35 bg-white/85 backdrop-blur-sm shadow-[0_20px_50px_-28px_rgba(97,43,0,0.55)] transition-transform duration-500 hover:-translate-y-1 hover:shadow-[0_24px_55px_-24px_rgba(97,43,0,0.65)] text-left"
    >
      <div className="relative h-[220px] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/85 text-[#8B4513] text-xs font-semibold shadow-sm">
          Khám phá
          <span aria-hidden className="translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
        </span>
      </div>
      <div className="px-5 pb-5 pt-4 flex flex-col gap-2">
        <span className="font-nunito text-xs tracking-[0.28em] text-[#9E211F] uppercase">{date}</span>
        <h3 className="font-nunito text-lg font-semibold text-[#1C355E] leading-snug line-clamp-2">{title}</h3>
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
    <section className="relative overflow-hidden bg-[#FFF6E9] pt-20 pb-24">
      <div className="relative max-w-[1440px] mx-auto px-4 md:px-10 lg:px-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 text-[#8B4513] text-xs font-semibold uppercase tracking-[0.25em]">
              Góc truyện làng nghề
            </span>
            <div>
              <h2 className={SECTION_TITLE_CLASS}>Khám phá Hòa Lạc</h2>
              <p className={`mt-3 ${SECTION_SUBTITLE_CLASS} max-w-2xl`}>
                Những câu chuyện, sự kiện và cảm hứng xoay quanh hành trình gìn giữ và phát triển nghề thủ công truyền thống.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/blog')}
            className={`${PRIMARY_BUTTON_CLASS} self-start md:self-end`}
          >
            Xem tất cả bài viết
            <span aria-hidden className="text-lg">→</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 w-full">
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                <div key={idx} className="h-[260px] rounded-3xl bg-white/80 border border-[#D4A574]/30 shadow animate-pulse" />
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
            <div className="mt-2">
              <Pagination totalPages={totalPages} pageIndex={pageIndex} setPageIndex={setPageIndex} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DiscoverHoaLac;
