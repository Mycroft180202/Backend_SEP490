import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaTimes,
  FaUpload,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { BlogService } from '../../services/modules/blog/blogService';
import { UserService } from '../../services/modules/users/userService';
import axiosClient from '../../services/api/axiosConfig';
import Pagination from '../shared/Pagination';

class Base64UploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(
      (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({ default: reader.result });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      }),
    );
  }

  abort() {
    // Nothing special to clean up for FileReader
  }
}


const statusOptions = [
  { value: 'Published', label: 'Đã xuất bản' },
  { value: 'Draft', label: 'Bản nháp' },
  { value: 'Archived', label: 'Đã lưu trữ' },
];

const emptyForm = {
  id: '',
  title: '',
  content: '',
  postStatus: 'Draft',
  image: null,
  imageUrl: '',
  authorId: '',
};

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20];

const normalizeStatus = (status) => {
  if (!status) return 'Draft';
  const value = status.toString().toLowerCase();
  if (value === 'active' || value === 'published') return 'Published';
  if (value === 'archived' || value === 'inactive') return 'Archived';
  if (value === 'draft') return 'Draft';
  return status;
};

const getStatusLabel = (status) => {
  const normalized = normalizeStatus(status);
  return statusOptions.find((option) => option.value === normalized)?.label || normalized;
};

const BlogManagement = ({ isAdmin = true }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1 });
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [authorMap, setAuthorMap] = useState({});
  const pageSizeRef = useRef(DEFAULT_PAGE_SIZE);
  const [previewBlog, setPreviewBlog] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteBlog, setConfirmDeleteBlog] = useState(null);
  const handleEditorReady = useCallback((editor) => {
    editor.editing.view.change((writer) => {
      writer.setStyle('min-height', '420px', editor.editing.view.document.getRoot());
    });
    if (editor?.plugins?.get('FileRepository')) {
      editor.plugins.get('FileRepository').createUploadAdapter = (loader) => new Base64UploadAdapter(loader);
    }
  }, []);
  const releasePreviewUrl = useCallback((url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const buildAuthorName = useCallback((blog) => {
    if (!blog) return '';
    return authorMap[blog.authorId]
      || blog.authorName
      || blog.author
      || blog.authorId
      || '';
  }, [authorMap]);

  useEffect(() => {
    pageSizeRef.current = pageSize;
  }, [pageSize]);

  const loadBlogs = useCallback(async (page = 1, size) => {
    const effectiveSize = size || pageSizeRef.current;
    try {
      setLoading(true);
      const response = await BlogService.getAll({
        pageIndex: page,
        pageSize: effectiveSize,
      });
      const items = response.items || [];
      setBlogs(items);

      const raw = response.raw || {};
      const totalCount = raw.totalCount ?? items.length;
      const totalPages = raw.totalPages
        ?? Math.max(1, Math.ceil(totalCount / effectiveSize));

      setMeta({
        totalCount,
        totalPages,
        pageSize: effectiveSize,
      });
    } catch (error) {
      console.error('Load blogs error:', error);
      toast.error(
        error?.response?.data?.message
          || error?.message
          || 'Không thể tải danh sách bài viết.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs(pageIndex, pageSize);
  }, [loadBlogs, pageIndex, pageSize]);

  useEffect(() => {
    return () => {
      releasePreviewUrl(previewUrl);
    };
  }, [previewUrl, releasePreviewUrl]);

  const filteredBlogs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return blogs.filter((blog) => {
      const titleMatch = keyword
        ? (blog.title || '').toLowerCase().includes(keyword)
        : true;
      const authorSource = buildAuthorName(blog);
      const authorMatch = keyword
        ? authorSource.toLowerCase().includes(keyword)
        : true;
      const normalizedStatus = normalizeStatus(blog.postStatus);
      const matchStatus = statusFilter === 'all'
        || normalizedStatus === statusFilter;

      return (titleMatch || authorMatch) && matchStatus;
    });
  }, [blogs, searchTerm, statusFilter, buildAuthorName]);

  const stats = useMemo(() => {
    const counts = blogs.reduce(
      (acc, blog) => {
        const normalizedStatus = normalizeStatus(blog.postStatus);
        if (normalizedStatus === 'Published') acc.published += 1;
        if (normalizedStatus === 'Draft') acc.draft += 1;
        if (normalizedStatus === 'Archived') acc.archived += 1;
        return acc;
      },
      { published: 0, draft: 0, archived: 0 },
    );

    return {
      total: meta.totalCount || blogs.length,
      published: counts.published,
      draft: counts.draft,
      archived: counts.archived,
      visible: blogs.length,
    };
  }, [blogs, meta.totalCount]);

  const pageRange = useMemo(() => {
    if (!meta.totalCount) {
      return { start: 0, end: 0 };
    }
    const start = ((pageIndex - 1) * pageSize) + 1;
    const end = Math.min(meta.totalCount, pageIndex * pageSize);
    return { start, end };
  }, [meta.totalCount, pageIndex, pageSize]);

  useEffect(() => {
    const uniqueIds = [...new Set(blogs.map((blog) => blog.authorId).filter(Boolean))];
    const missingIds = uniqueIds.filter((id) => !authorMap[id]);
    if (!missingIds.length) return undefined;
    let isMounted = true;

    const fetchAuthors = async () => {
      try {
        const results = await Promise.all(missingIds.map(async (id) => {
          try {
            const data = await UserService.getById(id);
            return {
              id,
              name: data?.displayName
                || data?.fullName
                || data?.username
                || data?.email
                || id,
            };
          } catch (error) {
            console.warn('Fetch author name error:', error);
            return { id, name: id };
          }
        }));

        if (!isMounted) return;

        setAuthorMap((prev) => {
          const next = { ...prev };
          results.forEach(({ id, name }) => {
            next[id] = name;
          });
          return next;
        });
      } catch (error) {
        console.error('Author loading error:', error);
      }
    };

    fetchAuthors();

    return () => {
      isMounted = false;
    };
  }, [authorMap, blogs]);

  const handleOpenModal = (blog = null) => {
    if (!isAdmin) {
      toast.warn('Bạn không có quyền chỉnh sửa bài viết.');
      return;
    }

    releasePreviewUrl(previewUrl);
    setPreviewUrl('');

    if (blog) {
      const displayImage = blog.imageUrl || blog.coverImageUrl || blog.image || '';
      setFormData({
        id: blog.id,
        title: blog.title || '',
        content: blog.content || '',
        postStatus: normalizeStatus(blog.postStatus),
        image: null,
        imageUrl: displayImage || '',
        authorId: blog.authorId || '',
      });

      if (displayImage) {
        setPreviewUrl(displayImage);
      }
    } else {
      setFormData(emptyForm);
    }

    setModalOpen(true);
  };

  const handlePreview = (blog) => {
    setPreviewBlog(blog);
  };

  const handleClosePreview = () => {
    setPreviewBlog(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData(emptyForm);
    releasePreviewUrl(previewUrl);
    setPreviewUrl('');
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCoverImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      releasePreviewUrl(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFormData((prev) => ({
        ...prev,
        image: file,
        imageUrl: url,
      }));
    }
  };

  const handlePageSizeChange = (event) => {
    const value = Number(event.target.value);
    setPageIndex(1);
    setPageSize(value);
  };

  const fetchImageFile = async (url) => {
    if (!url) return null;
    try {
      const response = await axiosClient.get(url, { responseType: 'blob' });
      const blob = response.data;
      const contentType = blob.type || response.headers['content-type'] || 'image/jpeg';
      const baseName = url.split('?')[0]?.split('/').pop() || 'image';
      const extension = contentType.split('/')[1] || 'jpg';
      const fileName = baseName.includes('.') ? baseName : `${baseName}.${extension}`;
      return new File([blob], fileName, { type: contentType });
    } catch (error) {
      console.error('Image fetch error:', error);
      toast.error('Không thể tải ảnh hiện tại. Vui lòng chọn ảnh mới khi chỉnh sửa.');
      return null;
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề.');
      return false;
    }
    const plainContent = formData.content
      ? formData.content.replace(/<[^>]*>/g, '').trim()
      : '';
    if (plainContent.length < 20) {
      toast.error('Nội dung cần tối thiểu 20 ký tự.');
      return false;
    }
    if (!formData.image && !formData.imageUrl) {
      toast.error('Vui lòng chọn ảnh đại diện.');
      return false;
    }
    return true;
  };

  const buildPayload = async () => {
    const payload = new FormData();
    payload.append('Title', formData.title.trim());
    payload.append('Content', formData.content);
    payload.append('PostStatus', normalizeStatus(formData.postStatus));
    if (formData.id) {
      payload.append('Id', formData.id);
    }
    if (formData.authorId) {
      payload.append('AuthorId', formData.authorId);
    }

    if (formData.image instanceof File) {
      payload.append('Image', formData.image);
    } else if (formData.imageUrl) {
      const existingFile = await fetchImageFile(formData.imageUrl);
      if (!existingFile) {
        return null;
      }
      payload.append('Image', existingFile);
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSaving(true);

    try {
      const payload = await buildPayload();
      if (!payload) {
        setSaving(false);
        return;
      }

      if (formData.id) {
        await BlogService.update(formData.id, payload);
        toast.success('Đã cập nhật bài viết thành công.');
      } else {
        await BlogService.create(payload);
        toast.success('Đã tạo bài viết thành công.');
      }

      handleCloseModal();
      await loadBlogs(pageIndex, pageSize);
    } catch (error) {
      console.error('Save blog error:', error);
      toast.error(
        error?.response?.data?.message
          || error?.message
          || 'Không thể lưu bài viết.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(async (blogId) => {
    if (!isAdmin || !blogId) return;
    try {
      setDeletingId(blogId);
      await BlogService.delete(blogId);
      toast.success('Đã xóa bài viết thành công.');
      await loadBlogs(pageIndex, pageSize);
    } catch (error) {
      console.error('Delete blog error:', error);
      toast.error(
        error?.response?.data?.message
        || error?.message
        || 'Không thể xóa bài viết.',
      );
    } finally {
      setDeletingId(null);
    }
  }, [isAdmin, loadBlogs, pageIndex, pageSize]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDeleteBlog) return;
    await handleDelete(confirmDeleteBlog.id);
    setConfirmDeleteBlog(null);
  }, [confirmDeleteBlog, handleDelete]);

  const handleCancelDelete = () => {
    if (deletingId) return;
    setConfirmDeleteBlog(null);
  };

  const formatDate = (value) => {
    if (!value) return '--';
    try {
      return new Date(value).toLocaleDateString('vi-VN');
    } catch (error) {
      return value;
    }
  };

  const resolveImage = (blog) => (
    blog.imageUrl || blog.coverImageUrl || blog.image || ''
  );

  const renderStatusBadge = (status) => {
    const normalized = normalizeStatus(status);
    const className = {
      Published: 'bg-green-100 text-green-700',
      Draft: 'bg-yellow-100 text-yellow-700',
      Archived: 'bg-gray-200 text-gray-700',
    }[normalized] || 'bg-gray-100 text-gray-600';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
        {getStatusLabel(normalized)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tổng bài viết</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Đã xuất bản</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.published}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Bản nháp</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Đã lưu trữ</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.archived}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Đang hiển thị</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.visible}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tìm theo tiêu đề hoặc tác giả..."
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tất cả trạng thái</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Bài / trang</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-60"
            disabled={!isAdmin}
          >
            <FaPlus />
            Thêm bài viết
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                <th className="py-3 px-4">Tiêu đề</th>
                <th className="py-3 px-4">Tác giả</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Ngày xuất bản</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Đang tải bài viết...
                  </td>
                </tr>
              ) : filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Không có bài viết phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => {
                  const imageSrc = resolveImage(blog);
                  return (
                    <tr
                      key={blog.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {imageSrc && (
                            <img
                              src={imageSrc}
                              alt={blog.title}
                              className="w-12 h-12 rounded object-cover border"
                            />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                              {blog.title || 'Chưa đặt tiêu đề'}
                            </p>
                            <p className="text-xs text-gray-500">
                              #
                              {blog.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {buildAuthorName(blog) || 'Không rõ'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderStatusBadge(blog.postStatus)}
                      </td>
                      <td className="py-3 px-4 text-sm text-center text-gray-500">
                        {formatDate(blog.publishedAt || blog.updatedAt || blog.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800"
                            title="Xem trước"
                            onClick={() => handlePreview(blog)}
                          >
                            <FaEye />
                          </button>
                          <button
                            type="button"
                            className="text-green-600 hover:text-green-800 disabled:opacity-40"
                            title="Chỉnh sửa"
                            onClick={() => handleOpenModal(blog)}
                            disabled={!isAdmin}
                          >
                            <FaEdit />
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800 disabled:opacity-40"
                            title="Xóa"
                            onClick={() => setConfirmDeleteBlog(blog)}
                            disabled={!isAdmin || deletingId === blog.id}
                          >
                            {deletingId === blog.id ? (
                              <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full inline-block animate-spin" />
                            ) : (
                              <FaTrash />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="text-sm text-gray-500 mt-2">
          Hiển thị
          {' '}
          {pageRange.start}
          {' '}
          -
          {' '}
          {pageRange.end}
          {' '}
          trên tổng
          {' '}
          {meta.totalCount}
          {' '}
          bài viết
        </div>

        {meta.totalPages > 1 && (
          <Pagination
            totalPages={meta.totalPages}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
          />
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {formData.id ? 'Chỉnh sửa bài viết' : 'Tạo bài viết'}
                </p>
                <p className="text-sm text-gray-500">
                  Điền thông tin bên dưới để xuất bản bài viết.
                </p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={handleCloseModal}
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tiêu đề
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(event) => handleInputChange('title', event.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nhập tiêu đề rõ ràng"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      value={formData.postStatus}
                      onChange={(event) => handleInputChange('postStatus', event.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ảnh bìa
                  </label>
                  <div className="border border-dashed border-[#D4A574] rounded-lg p-4 text-center">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Ảnh xem trước"
                        className="w-full h-40 object-cover rounded-lg mb-4"
                      />
                    ) : (
                      <p className="text-sm text-gray-500 mb-4">
                        Chọn ảnh để làm nổi bật bài viết.
                      </p>
                    )}
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8B4513] text-white text-sm font-semibold cursor-pointer hover:bg-[#DDA15E] transition">
                      <FaUpload />
                      Chọn ảnh
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverImageChange}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nội dung
                </label>
                <div className="border rounded-lg overflow-hidden">
                  <CKEditor
                    editor={ClassicEditor}
                    data={formData.content}
                    onReady={handleEditorReady}
                    onChange={(_, editor) => {
                      const data = editor.getData();
                      handleInputChange('content', data);
                    }}
                    config={{
                      toolbar: [
                        'heading',
                        '|',
                        'bold',
                        'italic',
                        'link',
                        'bulletedList',
                        'numberedList',
                        'blockQuote',
                        'imageUpload',
                        '|',
                        'insertTable',
                        'undo',
                        'redo',
                      ],
                      image: {
                        toolbar: [
                          'imageTextAlternative',
                          'imageStyle:full',
                          'imageStyle:side',
                        ],
                      },
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                onClick={handleCloseModal}
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-[#8B4513] text-white font-semibold hover:bg-[#DDA15E] transition disabled:opacity-60"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : (formData.id ? 'Lưu thay đổi' : 'Tạo bài viết')}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewBlog && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  Xem trước: {previewBlog.title || 'Chưa đặt tiêu đề'}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <span>{buildAuthorName(previewBlog) || 'Tác giả chưa xác định'}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{formatDate(previewBlog.publishedAt || previewBlog.updatedAt || previewBlog.createdAt)}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>#{previewBlog.id}</span>
                </p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={handleClosePreview}
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {resolveImage(previewBlog) && (
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <img
                    src={resolveImage(previewBlog)}
                    alt={previewBlog.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {renderStatusBadge(previewBlog.postStatus)}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {buildAuthorName(previewBlog) || 'Không rõ'}
                </span>
              </div>

              <div className="prose max-w-none">
                {previewBlog.content ? (
                  <div
                    className="blog-preview-content text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: previewBlog.content }}
                  />
                ) : (
                  <p className="text-gray-500 text-sm">
                    Bài viết chưa có nội dung.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteBlog && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Xóa bài viết</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={handleCancelDelete}
                disabled={Boolean(deletingId)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Bạn có chắc chắn muốn xóa{' '}
                <span className="font-semibold text-[#8B4513]">
                  {confirmDeleteBlog.title || `#${confirmDeleteBlog.id}`}
                </span>
                ? Hành động này không thể hoàn tác.
              </p>
              {resolveImage(confirmDeleteBlog) && (
                <div className="rounded-lg overflow-hidden border border-gray-100">
                  <img
                    src={resolveImage(confirmDeleteBlog)}
                    alt={confirmDeleteBlog.title}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                onClick={handleCancelDelete}
                disabled={Boolean(deletingId)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingId)}
              >
                {deletingId ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

BlogManagement.propTypes = {
  isAdmin: PropTypes.bool,
};

export default BlogManagement;

