import React, { useEffect, useMemo, useState } from 'react';
import { BlogService } from '../../services/modules/blog/blogService';

const DEFAULT_IMAGE = 'https://via.placeholder.com/600x400?text=Blog';

const formatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('vi-VN');
};

const stripHtml = (value) => {
  if (!value) return '';
  return value.replace(/<[^>]+>/g, '');
};

const HeroBlogCard = ({ image, date, title, description }) => (
  <div className="relative rounded-3xl overflow-hidden group h-[420px] shadow-lg">
    <img
      src={image || DEFAULT_IMAGE}
      alt={title}
      className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-8 text-white space-y-3">
      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-white/20 rounded-full border border-white/40 tracking-wide">
        Tin noi bat
      </span>
      <p className="text-sm opacity-90">{date}</p>
      <h3 className="text-3xl font-semibold leading-snug">{title}</h3>
      <p className="text-sm opacity-80 line-clamp-3">{description}</p>
    </div>
  </div>
);

const MiniBlogCard = ({ image, date, title, description }) => (
  <div className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition">
    <div className="w-28 h-28 flex-shrink-0 overflow-hidden rounded-xl">
      <img
        src={image || DEFAULT_IMAGE}
        alt={title}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">{date}</p>
      <h4 className="font-semibold text-gray-900 line-clamp-2">{title}</h4>
      <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
    </div>
  </div>
);

const FamousBlog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const loadBlogs = async () => {
      try {
        setLoading(true);
        const response = await BlogService.getAll({ pageIndex: 1, pageSize: 5 });
        if (!ignore) {
          const items = (response.items || []).filter(
            (blog) => (blog.postStatus || '').toLowerCase() === 'active',
          );
          setBlogs(items);
        }
      } catch (error) {
        console.error('Failed to load featured blogs', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadBlogs();
    return () => { ignore = true; };
  }, []);

  const [hero, miniCards] = useMemo(() => {
    if (!blogs.length) return [null, []];
    return [blogs[0], blogs.slice(1, 5)];
  }, [blogs]);

  return (
    <section className="w-full py-12 md:py-20 lg:py-[120px] px-4 md:px-10 lg:px-36 bg-[#FFFBF0]">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#C5853E]">Blog</p>
            <h2 className="font-alata text-3xl md:text-4xl text-[#8B4513]">
              Tin tức nổi bật
            </h2>
          </div>
          <p className="text-sm text-gray-600 max-w-2xl">
            Cập nhật những câu chuyện mới nhất từ cộng đồng nghệ nhân và xu hướng thủ công Việt.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Đang tải nội dung...</p>
        ) : !hero ? (
          <p className="text-center text-gray-500">Chưa có bài viết nào.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <HeroBlogCard
                image={hero.image}
                date={formatDate(hero.publishedAt)}
                title={hero.title}
                description={stripHtml(hero.content).slice(0, 140) || '—'}
              />
            </div>
            <div className="lg:col-span-2 space-y-4">
              {miniCards.length ? (
                miniCards.map((blog) => (
                  <MiniBlogCard
                    key={blog.id || `${blog.title}-${blog.publishedAt}`}
                    image={blog.image}
                    date={formatDate(blog.publishedAt)}
                    title={blog.title}
                    description={stripHtml(blog.content).slice(0, 90) || '—'}
                  />
                ))
              ) : (
                <div className="text-gray-500 text-center py-12 bg-white rounded-2xl border border-dashed">
                  Các bài viết khác đang được cập nhật.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FamousBlog;
