import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import Breadcrumb from '../components/shared/Breadcrumb';
import Pagination from '../components/shared/Pagination';
import { BlogService } from '../services/modules/blog/blogService';
import { UserService } from '../services/modules/users/userService';

const API_PAGE_SIZE = 9;
const GRID_PAGE_SIZE = 6;
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

const getExcerpt = (content, limit = 140) => {
  if (!content) return '';
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trim()}...`;
};

const resolveImage = (blog) => (
  blog?.imageUrl
  || blog?.coverImageUrl
  || blog?.image
  || DEFAULT_IMAGE
);

const Blog = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gridPage, setGridPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const fetchBlogs = async () => {
      setLoading(true);
      try {
        let page = 1;
        let fetchedCount = 0;
        let totalCount = 0;
        const collected = [];

        while (true) {
          const response = await BlogService.getAll({
            pageIndex: page,
            pageSize: API_PAGE_SIZE,
          });

          const raw = response.raw || {};
          const items = response.items || [];
          fetchedCount += items.length;
          totalCount = raw.totalCount ?? totalCount;
          collected.push(...items.filter((item) => {
            const normalizedStatus = (item.postStatus || '').toString().toLowerCase();
            return normalizedStatus === 'published' || normalizedStatus === 'active';
          }));

          const hasNext = raw.hasNextPage
            ?? (raw.totalPages
              ? page < raw.totalPages
              : (raw.totalCount
                ? fetchedCount < raw.totalCount
                : items.length === API_PAGE_SIZE));

          if (!hasNext || items.length === 0) {
            break;
          }

          page += 1;
        }

        if (isMounted) {
          const authorIds = [...new Set(
            collected
              .map((item) => item.authorId || item.authorID)
              .filter((id) => Boolean(id)),
          )];

          const authorMap = new Map();

          if (authorIds.length) {
            await Promise.all(
              authorIds.map(async (authorId) => {
                try {
                  const profile = await UserService.getById(authorId);
                  if (profile) {
                    const resolvedName = profile.displayName
                      || profile.username
                      || profile.email
                      || '';
                    if (resolvedName) {
                      authorMap.set(authorId, resolvedName);
                    }
                  }
                } catch (authorError) {
                  console.error('Fetch author details error:', authorError);
                }
              }),
            );
            if (!isMounted) {
              return;
            }
          }

          const enriched = collected.map((item) => {
            const resolvedAuthorId = item.authorId || item.authorID;
            return {
              ...item,
              authorDisplayName:
                authorMap.get(resolvedAuthorId)
                || item.authorName
                || item.author
                || 'G90 Editorial',
            };
          });

          setBlogs(enriched);
        }
      } catch (error) {
        console.error('Fetch blogs error:', error);
        if (isMounted) {
          toast.error(
            error?.response?.data?.message
              || error?.message
              || 'Không thể tải các bài viết.',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBlogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredSections = useMemo(() => {
    if (!blogs.length) {
      return {
        hero: null,
        highlights: [],
        archive: [],
      };
    }

    const hero = blogs[0];
    const highlightStart = 1;
    const highlights = blogs.slice(highlightStart, highlightStart + 3);
    const archive = blogs.slice(hero ? 1 : 0);

    return { hero, highlights, archive };
  }, [blogs]);

  const { hero: heroBlog, highlights: highlightBlogs, archive: archiveItems } = featuredSections;

  const openBlog = (blogId) => {
    if (!blogId) return;
    navigate(`/blog/${blogId}`);
  };

  useEffect(() => {
    setGridPage(1);
  }, [archiveItems.length]);

  const paginatedArchive = useMemo(() => {
    if (!archiveItems.length) return [];
    const start = (gridPage - 1) * GRID_PAGE_SIZE;
    return archiveItems.slice(start, start + GRID_PAGE_SIZE);
  }, [archiveItems, gridPage]);

  const totalArchivePages = Math.max(
    1,
    Math.ceil((archiveItems.length || 1) / GRID_PAGE_SIZE),
  );

  return (
    <div className="min-h-screen bg-[#fdf9f4] flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="relative bg-[#fff8f1] text-gray-900 px-4 md:px-10 lg:px-36 py-12 md:py-16">
          <div className="absolute left-6 top-6 z-10">
            <Breadcrumb
              items={[
                { label: 'Trang chủ', href: '/' },
                { label: 'Bài viết' },
              ]}
              floating
            />
          </div>
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.5em] text-amber-600">
              <span className="h-px flex-1 bg-amber-200" />
              Tin tức làng nghề
              <span className="h-px flex-1 bg-amber-200" />
            </div>

            {loading ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[360px] rounded-[32px] bg-white/70 animate-pulse" />
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={index} className="h-32 rounded-2xl bg-white/70 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : heroBlog ? (
              <div className="grid lg:grid-cols-3 gap-8 items-stretch">
                <article
                  className="bg-white rounded-[32px] overflow-hidden shadow-lg border border-amber-100 flex flex-col lg:col-span-2 cursor-pointer transition hover:shadow-xl"
                  onClick={() => openBlog(heroBlog.id)}
                >
                  <div className="h-[360px] w-full overflow-hidden">
                    <img
                      src={resolveImage(heroBlog)}
                      alt={heroBlog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 md:p-8 lg:p-10 space-y-4">
                    <span className="text-xs uppercase tracking-[0.3em] text-amber-700 block">
                      {formatDate(heroBlog.publishedAt || heroBlog.updatedAt)}
                      {' -- '}
                      {heroBlog.displayName || 'G90 Editorial'}
                    </span>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight text-gray-900">
                      {heroBlog.title}
                    </h1>
                    <p className="text-sm md:text-base text-gray-600 max-w-3xl">
                      {getExcerpt(heroBlog.content, 200)}
                    </p>
                  </div>
                </article>

                <div className="space-y-4">
                  {highlightBlogs.length ? (
                    highlightBlogs.map((blog) => (
                      <article
                        key={blog.id}
                        className="bg-white rounded-2xl border border-amber-100 p-4 flex gap-4 shadow-sm hover:shadow-md transition cursor-pointer"
                        onClick={() => openBlog(blog.id)}
                      >
                        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={resolveImage(blog)}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.4em] text-amber-600">
                            {formatDate(blog.publishedAt || blog.updatedAt)}
                          </p>
                          <h3 className="text-base md:text-lg font-semibold mt-1 leading-snug text-gray-900">
                            {blog.title}
                          </h3>
                          <p className="text-xs text-gray-600 mt-2">
                            {getExcerpt(blog.content, 90)}
                          </p>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-amber-200 text-gray-500 text-sm">
                      Các bài viết sẽ được nổi bật trong thời gian tới.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                Chưa có bài viết nào được xuất bản. Vui lòng quay lại sau.
              </div>
            )}
          </div>
        </section>

        <section className="px-4 md:px-10 lg:px-36 py-12 md:py-16 bg-[#fff9f0]">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.5em] text-amber-600">Bài viết nổi bật</p>
                <h2 className="text-3xl md:text-4xl font-alata text-gray-900 mt-3">
                  Các bài viết gần đây
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                Hiển thị
                {' '}
                {paginatedArchive.length}
                {' '}
                trên
                {' '}
                {archiveItems.length}
                {' '}
                bài viết
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: GRID_PAGE_SIZE }).map((_, index) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    className="h-80 rounded-3xl bg-white/60 animate-pulse"
                  />
                ))}
              </div>
            ) : paginatedArchive.length ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedArchive.map((blog) => (
                    <article
                      key={blog.id}
                      className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition shadow-amber-50/40 flex flex-col overflow-hidden border border-amber-50 cursor-pointer"
                      onClick={() => openBlog(blog.id)}
                    >
                      <div className="h-56 overflow-hidden">
                        <img
                          src={resolveImage(blog)}
                          alt={blog.title}
                          className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                        />
                      </div>
                      <div className="p-5 flex flex-col gap-3 flex-1">
                        <span className="text-[11px] uppercase tracking-[0.4em] text-amber-600">
                          {formatDate(blog.publishedAt || blog.updatedAt)}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 leading-snug">
                          {blog.title}
                        </h3>
                        <p className="text-sm text-gray-600 flex-1">
                          {getExcerpt(blog.content)}
                        </p>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openBlog(blog.id);
                          }}
                          className="text-sm font-semibold text-[#8B4513] inline-flex items-center gap-2 mt-2"
                        >
                          Đọc bài viết
                          <span aria-hidden="true">-&gt;</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {totalArchivePages > 1 && (
                  <Pagination
                    totalPages={totalArchivePages}
                    pageIndex={gridPage}
                    setPageIndex={setGridPage}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-16 text-gray-500 border border-dashed border-amber-200 rounded-3xl">
                More stories will be published soon.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
