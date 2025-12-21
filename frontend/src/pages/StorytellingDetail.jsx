import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import Breadcrumb from '../components/shared/Breadcrumb';
import StorytellingService from '../services/modules/products/storytellingService';
import { NavigationKeys } from '../context/NavigationContext';
import useResolvedNavigationNode from '../hooks/useResolvedNavigationNode';
import useNavigationNode from '../hooks/useNavigationNode';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=1600&q=80';

const STORY_TYPE_LABELS = {
  ProductStory: 'Câu chuyện sản phẩm',
  CraftingProcess: 'Quy trình chế tác',
  ArtisanBiography: 'Nghệ nhân phía sau',
};

const formatDate = (value) => {
  if (!value) return 'Đang cập nhật';
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

const resolveImage = (story) => story?.image || DEFAULT_IMAGE;

const toPlainText = (value) => {
  if (!value) return '';
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const StorytellingDetail = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [relatedStories, setRelatedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fallbackStoryTitle = useMemo(
    () => story?.title || 'Chi tiết câu chuyện',
    [story?.title],
  );
  const fromProduct = useResolvedNavigationNode({
    locationKey: 'fromProduct',
    contextKey: NavigationKeys.LAST_PRODUCT,
  });
  const storyBreadcrumbs = useMemo(() => {
    const items = [{ label: 'Trang chủ', href: '/' }];
    if (fromProduct?.label && fromProduct?.href) {
      items.push(fromProduct);
    }
    items.push({ label: fallbackStoryTitle });
    return items;
  }, [fallbackStoryTitle, fromProduct]);
  const storyNavigationNode = useMemo(() => (
    story?.id
      ? {
        label: fallbackStoryTitle,
        href: `/storytelling/${story.id}`,
      }
      : null
  ), [fallbackStoryTitle, story?.id]);

  useNavigationNode(NavigationKeys.LAST_STORY, storyNavigationNode);

  const navigateToProduct = useCallback(() => {
    if (fromProduct?.href) {
      navigate(fromProduct.href, { state: { fromProduct } });
      return;
    }
    navigate(-1);
  }, [fromProduct, navigate]);

  useEffect(() => {
    if (!storyId) {
      setError('Không tìm thấy câu chuyện phù hợp.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchStoryDetail = async () => {
      setLoading(true);
      setError('');
      setRelatedStories([]);
      try {
        const detail = await StorytellingService.getStoryById(storyId);
        if (isMounted) {
          setStory(detail);
        }

        if (detail?.productId) {
          const stories = await StorytellingService.getStoriesByProduct(detail.productId);
          if (isMounted && Array.isArray(stories)) {
            const others = stories
              .filter((item) => String(item.id) !== String(detail.id))
              .slice(0, 3);
            setRelatedStories(others);
          }
        } else if (isMounted) {
          setRelatedStories([]);
        }
      } catch (fetchError) {
        console.error('Fetch storytelling detail error:', fetchError);
        const message = fetchError?.response?.data?.message
          || fetchError?.message
          || 'Không thể tải câu chuyện.';
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

    fetchStoryDetail();

    return () => {
      isMounted = false;
    };
  }, [storyId]);

  const storyTypeLabel = useMemo(() => {
    if (!story?.storyType) return 'Storytelling';
    return STORY_TYPE_LABELS[story.storyType] || story.storyType;
  }, [story?.storyType]);

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

    if (error || !story) {
      return (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-6">{error || 'Câu chuyện không tồn tại.'}</p>
          <button
            type="button"
            onClick={navigateToProduct}
            className="px-6 py-3 rounded-full bg-[#8B4513] text-white font-semibold hover:bg-[#A25C2B] transition"
          >
            Quay lại
          </button>
        </div>
      );
    }

    return (
      <>
        <section className="relative isolate">
          <div className="absolute inset-0">
            <img
              src={resolveImage(story)}
              alt={story.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#fff9f0]" />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-10 lg:px-36 py-24 text-white space-y-4">
            <span className="inline-flex items-center px-4 py-1 rounded-full border border-amber-300 text-xs tracking-[0.4em] uppercase text-amber-100/80">
              {storyTypeLabel}
            </span>
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
              {story.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-white/90">
              <span>
                Đăng ngày
                {' '}
                <strong>{formatDate(story.updatedAt || story.createdAt)}</strong>
              </span>
              <span className="w-1 h-1 rounded-full bg-white/60" />
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-8 md:px-14 lg:px-24 xl:px-32 py-12 space-y-10">
          <article className="bg-white rounded-[32px] shadow-xl p-8 md:px-16 md:py-12 xl:px-20 space-y-6">
            <div className="text-sm text-amber-700 uppercase tracking-[0.5em]">
              Câu chuyện chi tiết
            </div>
            <div
              className="prose prose-2xl max-w-none text-gray-800 leading-relaxed blog-detail-content"
              dangerouslySetInnerHTML={{
                __html: story.content || '<p>Nội dung sẽ được cập nhật.</p>',
              }}
            />
          </article>
        </section>

        {relatedStories.length > 0 && (
          <section className="bg-[#fff8f1] px-4 md:px-10 lg:px-36 py-16">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.5em] text-amber-600">Những câu chuyện khác</p>
                  <h2 className="text-3xl font-semibold text-gray-900 mt-3">
                    Khám phá thêm
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={navigateToProduct}
                  className="text-sm font-semibold text-[#8B4513] hover:underline"
                >
                  Quay lại sản phẩm
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedStories.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
                  >
                    <div className="h-48 overflow-hidden">
                      <img
                        src={item.image || DEFAULT_IMAGE}
                        alt={item.title}
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-5 space-y-3 flex-1 flex flex-col">
                      <span className="text-[11px] uppercase tracking-[0.4em] text-amber-600">
                        {STORY_TYPE_LABELS[item.storyType] || item.storyType || 'Story'}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {toPlainText(item.content) || 'Khám phá câu chuyện thủ công độc đáo.'}
                      </p>
                      <Link
                        to={`/storytelling/${item.id}`}
                        state={fromProduct ? { fromProduct } : undefined}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8B4513] hover:text-[#A25C2B]"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      >
                        Đọc câu chuyện
                        <span aria-hidden>→</span>
                      </Link>
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
      <div className="bg-[#fff4e5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={storyBreadcrumbs} floating />
        </div>
      </div>
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default StorytellingDetail;
