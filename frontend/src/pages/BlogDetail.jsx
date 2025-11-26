import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import { BlogService } from '../services/modules/blog/blogService';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=1600&q=80';

const formatDate = (value) => {
  if (!value) return 'Updating';
  try {
    return new Date(value).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return value;
  }
};

const resolveImage = (blog) => (
  blog?.imageUrl
  || blog?.coverImageUrl
  || blog?.image
  || DEFAULT_IMAGE
);

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Blog không tồn tại.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchBlog = async () => {
      setLoading(true);
      setError('');
      try {
        const blogData = await BlogService.getById(id);
        if (isMounted) {
          setBlog(blogData);
        }

        const listResponse = await BlogService.getAll({ pageIndex: 1, pageSize: 9 });
        const candidates = (listResponse.items || [])
          .filter((item) => item.id !== id && item.postStatus === 'Active')
          .slice(0, 3);
        if (isMounted) {
          setRelatedBlogs(candidates);
        }
      } catch (fetchError) {
        console.error('Fetch blog detail error:', fetchError);
        const message = fetchError?.response?.data?.message
          || fetchError?.message
          || 'Không thể tải bài viết.';
        if (isMounted) {
          setError(message);
        }
        toast.error(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBlog();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const authorName = useMemo(() => {
    if (!blog) return '';
    return (
      blog.displayName
      || blog.authorDisplayName
      || blog.authorName
      || blog.author
      || blog.authorId
      || 'G90 Editorial'
    );
  }, [blog]);

  const handleOpenBlog = (blogId) => {
    if (!blogId || blogId === id) return;
    navigate(`/blog/${blogId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-6">
          <div className="h-72 bg-white/60 rounded-3xl" />
          <div className="h-6 bg-white/60 rounded w-1/3" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className="h-4 bg-white/60 rounded"
              />
            ))}
          </div>
        </div>
      );
    }

    if (error || !blog) {
      return (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-6">{error || 'Bài viết không tồn tại.'}</p>
          <button
            type="button"
            onClick={() => navigate('/blog')}
            className="px-6 py-3 rounded-full bg-[#8B4513] text-white font-semibold hover:bg-[#A25C2B] transition"
          >
            Quay lại trang blog
          </button>
        </div>
      );
    }

    return (
      <>
        <section className="relative isolate">
          <div className="absolute inset-0">
            <img
              src={resolveImage(blog)}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#fff9f0]" />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-10 lg:px-36 py-24 text-white space-y-4">
            <p className="text-xs uppercase tracking-[0.5em] text-amber-200">
              {formatDate(blog.publishedAt || blog.updatedAt || blog.createdAt)}
            </p>
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
              {blog.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-white/90">
              <span>
                Bởi
                {' '}
                <strong>{authorName}</strong>
              </span>
              <span className="w-1 h-1 rounded-full bg-white/60" />
              <span>Đăng ở: {blog.category || 'Tin tức'}</span>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-8 md:px-14 lg:px-24 xl:px-32 py-12 space-y-10">
          <article className="bg-white rounded-[32px] shadow-xl p-8 md:px-16 md:py-12 xl:px-20 space-y-6">
            <div className="text-sm text-amber-700 uppercase tracking-[0.5em]">
              Nội dung chính
            </div>
            <div
              className="prose prose-2xl max-w-none text-gray-800 leading-relaxed blog-detail-content"
              dangerouslySetInnerHTML={{ __html: blog.content || '<p>Nội dung sẽ được cập nhật.</p>' }}
            />
            <div className="pt-6 border-t border-amber-50 flex flex-wrap gap-4 text-sm text-gray-500">
              <span>
                Tình trạng:
                {' '}
                <strong>{blog.postStatus || 'Active'}</strong>
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>
                Mã bài viết:
                {' '}
                {blog.id}
              </span>
            </div>
          </article>
        </section>

        {relatedBlogs.length > 0 && (
          <section className="bg-[#fff8f1] px-4 md:px-10 lg:px-36 py-16">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.5em] text-amber-600">Có thể bạn sẽ thích</p>
                  <h2 className="text-3xl font-semibold text-gray-900 mt-3">
                    Bài viết liên quan
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/blog')}
                  className="text-sm font-semibold text-[#8B4513] hover:underline"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedBlogs.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden flex flex-col"
                    onClick={() => handleOpenBlog(item.id)}
                  >
                    <div className="h-48 overflow-hidden">
                      <img
                        src={resolveImage(item)}
                        alt={item.title}
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-5 space-y-2 flex-1 flex flex-col">
                      <span className="text-[11px] uppercase tracking-[0.4em] text-amber-600">
                        {formatDate(item.publishedAt || item.updatedAt)}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.summary
                          || item.description
                          || 'Khám phá thêm về câu chuyện thủ công truyền thống.'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#fff9f0] flex flex-col">
      <Header />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default BlogDetail;

