import React, { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaRegImage, FaPen, FaTrash, FaTimes, FaSpinner } from 'react-icons/fa';
import StorytellingService from '../../services/modules/products/storytellingService';
import { toast } from 'react-toastify';

const storyTypeOptions = [
  { value: 'ProductStory', label: 'Câu chuyện sản phẩm' },
  { value: 'CraftingProcess', label: 'Quy trình chế tác' },
  { value: 'ArtisanBiography', label: 'Câu chuyện Nghệ nhân' },
];

const buildEmptyForm = () => ({
  storyType: 'ProductStory',
  title: '',
  content: '',
  image: null,
  preview: '',
});

const ProductStoryManager = ({ product, onClose }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState(buildEmptyForm);
  const [editingStory, setEditingStory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const productId = product?.id;

  const modalTitle = useMemo(() => {
    if (editingStory) return 'Cập nhật câu chuyện';
    return 'Thêm câu chuyện mới';
  }, [editingStory]);

  useEffect(() => {
    if (!productId) return;
    const loadStories = async () => {
      try {
        setLoading(true);
        const data = await StorytellingService.getStoriesByProduct(productId);
        setStories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Load storytelling error:', err);
        toast.error('Không thể tải nội dung quảng bá.');
      } finally {
        setLoading(false);
      }
    };

    loadStories();
  }, [productId]);

  useEffect(() => {
    if (!editingStory) {
      setFormState(buildEmptyForm());
      return;
    }
    setFormState({
      storyType: editingStory.storyType || 'ProductStory',
      title: editingStory.title || '',
      content: editingStory.content || '',
      image: null,
      preview: editingStory.image || '',
    });
  }, [editingStory]);

  useEffect(() => {
    if (!formState.preview) return undefined;
    if (typeof window === 'undefined' || typeof URL.revokeObjectURL !== 'function') return undefined;
    const isFile = typeof File !== 'undefined' && formState.image instanceof File;
    if (!isFile) return undefined;
    const previewUrl = formState.preview;
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [formState.image, formState.preview]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFormState((prev) => ({ ...prev, image: null, preview: editingStory?.image || '' }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormState((prev) => ({ ...prev, image: file, preview: previewUrl }));
  };

  const resetForm = () => {
    setFormState(buildEmptyForm());
    setEditingStory(null);
  };

  const refreshStories = async () => {
    if (!productId) return;
    try {
      const data = await StorytellingService.getStoriesByProduct(productId);
      setStories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Refresh storytelling error:', err);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!productId) return;

    if (!formState.title.trim()) {
      toast.warning('Vui lòng nhập tiêu đề.');
      return;
    }

    if (!editingStory && !formState.image) {
      toast.warning('Vui lòng chọn ảnh để tạo câu chuyện.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        storyType: formState.storyType,
        title: formState.title.trim(),
        content: formState.content.trim(),
        image: formState.image,
      };

      if (editingStory) {
        await StorytellingService.updateStory(editingStory.id, payload);
        toast.success('Đã cập nhật câu chuyện.');
      } else {
        await StorytellingService.createStory(productId, payload);
        toast.success('Đã thêm câu chuyện mới.');
      }

      await refreshStories();
      resetForm();
    } catch (err) {
      console.error('Submit storytelling error:', err);
      toast.error(err?.response?.data?.message || 'Không thể lưu câu chuyện.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (story) => {
    if (!story?.id) return;
    if (!window.confirm('Bạn muốn xoá câu chuyện này?')) return;

    try {
      await StorytellingService.deleteStory(story.id);
      toast.success('Đã xoá câu chuyện.');
      await refreshStories();
      if (editingStory?.id === story.id) {
        resetForm();
      }
    } catch (err) {
      console.error('Delete storytelling error:', err);
      toast.error(err?.response?.data?.message || 'Không thể xoá câu chuyện.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Quảng bá sản phẩm</h3>
            <p className="text-sm text-gray-500">{product?.name}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-500 transition-colors hover:text-gray-700"
            aria-label="Đóng"
          >
            <FaTimes />
          </button>
        </div>

        <div className="grid max-h-[80vh] grid-cols-1 gap-0 overflow-y-auto md:grid-cols-[1.2fr_1fr]">
          <div className="border-r border-gray-100 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold text-gray-800">Danh sách câu chuyện</h4>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{stories.length} mục</span>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center text-gray-500">
                <FaSpinner className="mr-2 animate-spin" /> Đang tải...
              </div>
            ) : stories.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                Chưa có nội dung quảng bá.
              </div>
            ) : (
              <div className="space-y-4">
                {stories.map((story) => {
                  const typeMeta = storyTypeOptions.find((opt) => opt.value === story.storyType);
                  return (
                    <div key={story.id} className="group rounded-xl border border-gray-200 p-4 shadow-sm transition hover:border-primary/60">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                            {typeMeta ? typeMeta.label : story.storyType}
                          </p>
                          <h5 className="mt-1 text-base font-bold text-gray-800">{story.title}</h5>
                        </div>
                        <div className="flex gap-2 text-sm">
                          <button
                            type="button"
                            onClick={() => setEditingStory(story)}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1 text-gray-600 transition hover:border-primary/60 hover:text-primary"
                          >
                            <FaPen /> Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(story)}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-red-600 transition hover:bg-red-50"
                          >
                            <FaTrash /> Xoá
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-col gap-3 md:flex-row">
                        <div className="flex-1 text-sm text-gray-600">
                          <p className="line-clamp-3">{story.content || 'Chưa cập nhật nội dung chi tiết.'}</p>
                          <p className="mt-2 text-xs text-gray-400">
                            Cập nhật: {story.updatedAt ? new Date(story.updatedAt).toLocaleString('vi-VN') : '—'}
                          </p>
                        </div>
                        {story.image && (
                          <img
                            src={story.image}
                            alt={story.title}
                            className="h-24 w-24 flex-shrink-0 rounded-lg border border-gray-200 object-cover"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-6">
            <h4 className="mb-4 text-base font-semibold text-gray-800">{modalTitle}</h4>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Loại câu chuyện</label>
                <select
                  value={formState.storyType}
                  onChange={(event) => setFormState((prev) => ({ ...prev, storyType: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={submitting}
                >
                  {storyTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Tiêu đề</label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={150}
                  disabled={submitting}
                  placeholder="Nhập tiêu đề hấp dẫn"
                />
                <p className="mt-1 text-xs text-gray-400">{formState.title.length}/150 ký tự</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Nội dung</label>
                <textarea
                  value={formState.content}
                  onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                  className="h-32 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tóm tắt câu chuyện, có thể dán link nội dung chi tiết từ CKEditor"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Hình ảnh minh hoạ</label>
                <div className="flex items-center gap-3">
                  <label className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:border-primary hover:text-primary ${submitting ? 'pointer-events-none opacity-60' : ''}`}>
                    <FaRegImage /> Chọn ảnh
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={submitting}
                    />
                  </label>
                  {formState.preview && (
                    <img src={formState.preview} alt="preview" className="h-14 w-14 rounded-lg border border-gray-200 object-cover" />
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">Hỗ trợ JPG, PNG, WebP. Dung lượng tối đa 5MB.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Làm mới
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? <FaSpinner className="animate-spin" /> : editingStory ? <FaPen /> : <FaPlus />}
                  {editingStory ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductStoryManager;
