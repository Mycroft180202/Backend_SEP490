import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import {
  FaPlus,
  FaSearch,
  FaEye,
  FaTimes,
  FaSync,
  FaEdit,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Pagination from '../shared/Pagination';
import { BlogService } from '../../services/modules/blog/blogService';
import { UserService } from '../../services/modules/users/userService';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tat ca trang thai' },
  { value: 'Active', label: 'Dang xuat ban' },
  { value: 'Draft', label: 'Ban nhap' },
  { value: 'Archived', label: 'Luu tru' },
];

const FORM_STATUS_OPTIONS = STATUS_OPTIONS.filter((status) => status.value !== 'all');

const PAGE_SIZE_OPTIONS = [3, 6, 9, 12];
const STAT_BATCH_SIZE = 50;

const statusClassName = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'draft':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const BlogRowActions = ({ blog, onPreview, onEdit }) => (
  <div className="flex items-center gap-3 justify-center">
    <button
      type="button"
      className="text-blue-600 hover:text-blue-800 transition"
      title="Xem truoc"
      onClick={() => onPreview(blog)}
    >
      <FaEye />
    </button>
    <button
      type="button"
      className="text-green-600 hover:text-green-800 transition"
      title="Chinh sua"
      onClick={() => onEdit(blog)}
    >
      <FaEdit />
    </button>
  </div>
);

BlogRowActions.propTypes = {
  blog: PropTypes.shape({
    title: PropTypes.string,
  }).isRequired,
  onPreview: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageFile: null,
    postStatus: 'Draft',
  });
  const [submitting, setSubmitting] = useState(false);

  const [previewBlog, setPreviewBlog] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [authorNames, setAuthorNames] = useState({});

  const loadBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await BlogService.getAll({
        pageIndex,
        pageSize,
      });
      setBlogs(response.items || []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error('Failed to load blogs', error);
      toast.error(
        error?.response?.data?.message
        || 'Khong the tai danh sach blog.',
      );
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize]);

  const loadStats = useCallback(async () => {
    try {
      let currentPage = 1;
      let snapshotPages = 1;
      let total = 0;
      let active = 0;
      let draft = 0;

      while (currentPage <= snapshotPages) {
        const response = await BlogService.getAll({
          pageIndex: currentPage,
          pageSize: STAT_BATCH_SIZE,
        });
        const items = response.items || [];
        snapshotPages = response.totalPages || snapshotPages;
        total = response.totalCount ?? (total + items.length);

        items.forEach((blog) => {
          const status = (blog?.postStatus || '').toLowerCase();
          if (status === 'active') active += 1;
          else if (status === 'draft') draft += 1;
        });

        if (!response.hasNextPage) break;
        currentPage += 1;
      }

      setStats({
        total,
        active,
        draft,
      });
    } catch (error) {
      console.error('Failed to load blog stats', error);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs, refreshKey]);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshKey]);

  const fetchAuthorNames = useCallback(async (ids = []) => {
    if (!ids.length) return;
    const uniqueIds = [...new Set(ids)].filter(Boolean);
    if (!uniqueIds.length) return;

    try {
      const responses = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const data = await UserService.getUserById(id);
            return [id, data];
          } catch (error) {
            console.error(`Failed to fetch author ${id}`, error);
            return [id, null];
          }
        }),
      );
      setAuthorNames((prev) => {
        const next = { ...prev };
        responses.forEach(([id, data]) => {
          if (!next[id]) {
            next[id] = data;
          }
        });
        return next;
      });
    } catch (error) {
      console.error('Failed to load author names', error);
    }
  }, []);

  useEffect(() => {
    if (!blogs.length) return;
    const missingIds = blogs
      .map((blog) => blog.authorId)
      .filter((id) => id && !authorNames[id]);
    if (missingIds.length) {
      fetchAuthorNames(missingIds);
    }
  }, [blogs, authorNames, fetchAuthorNames]);

  const filteredBlogs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return blogs.filter((blog) => {
      const title = (blog.title || '').toLowerCase();
      const content = (blog.content || '').toLowerCase();
      const matchKeyword = !keyword || title.includes(keyword) || content.includes(keyword);
      const matchStatus =
        statusFilter === 'all'
        || (blog.postStatus || '').toLowerCase() === statusFilter.toLowerCase();
      return matchKeyword && matchStatus;
    });
  }, [blogs, searchTerm, statusFilter]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleOpenForm = () => {
    setEditingBlogId(null);
    setFormData({
      title: '',
      content: '',
      imageFile: null,
      postStatus: 'Draft',
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingBlogId(null);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    handleFormChange('imageFile', file);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.warn('Vui long nhap tieu de.');
      return;
    }
    if (!formData.content.trim()) {
      toast.warn('Vui long nhap noi dung.');
      return;
    }
    if (!editingBlogId && !formData.imageFile) {
      toast.warn('Vui long chon anh bai viet.');
      return;
    }
    if (!formData.postStatus) {
      toast.warn('Vui long chon trang thai bai viet.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append('Title', formData.title);
      payload.append('Content', formData.content);
      payload.append('PostStatus', formData.postStatus);
      if (formData.imageFile) {
        payload.append('Image', formData.imageFile);
      }

      if (editingBlogId) {
        await BlogService.update(editingBlogId, payload);
        toast.success('Da cap nhat blog.');
      } else {
        await BlogService.create(payload);
        toast.success('Da tao blog moi.');
      }

      setFormOpen(false);
      setEditingBlogId(null);
      handleRefresh();
    } catch (error) {
      console.error('Blog submit error', error);
      toast.error(
        error?.response?.data?.message
        || 'Khong the luu blog.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBlog = (blog) => {
    if (!blog) return;
    setEditingBlogId(blog.id);
    setFormData({
      title: blog.title || '',
      content: blog.content || '',
      imageFile: null,
      postStatus: blog.postStatus || 'Draft',
    });
    setFormOpen(true);
  };

  const handlePreview = (blog) => {
    setPreviewBlog(blog);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewBlog(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Tong bai viet</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total || totalCount}</p>
          <p className="text-xs text-gray-400 mt-2">Trang {pageIndex}/{Math.max(totalPages, 1)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Dang xuat ban</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Ban nhap</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.draft}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tim theo tieu de, noi dung..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPageIndex(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / trang
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
              Lam moi
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-red-700 transition"
              onClick={handleOpenForm}
            >
              <FaPlus /> Viet moi
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
                <th className="py-3 pr-4">Tieu de</th>
                <th className="py-3 pr-4">Tac gia</th>
                <th className="py-3 pr-4">Trang thai</th>
                <th className="py-3 pr-4">Ngay dang</th>
                <th className="py-3 pr-4 text-center">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    Dang tai du lieu...
                  </td>
                </tr>
              ) : filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    Khong co blog phu hop.
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr
                    key={`${blog.title}-${blog.publishedAt}`}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-gray-800">{blog.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{blog.content}</p>
                    </td>
                    <td className="py-4 pr-4 text-gray-700">
                      {(() => {
                        const author = authorNames[blog.authorId];
                        if (typeof author === 'string') return author;
                        if (author) {
                          return author.displayName
                            || author.username
                            || author.name
                            || blog.authorId;
                        }
                        return blog.authorId || 'He thong';
                      })()}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClassName(blog.postStatus)}`}>
                        {blog.postStatus || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-gray-700">
                      {blog.publishedAt
                        ? new Date(blog.publishedAt).toLocaleString('vi-VN')
                        : '--'}
                    </td>
                    <td className="py-4 pr-4">
                      <BlogRowActions
                        blog={blog}
                        onPreview={handlePreview}
                        onEdit={handleEditBlog}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-600 gap-2">
          <p>
            Dang hien {filteredBlogs.length} / {blogs.length} bai viet tren trang nay
            — Tong he thong: {totalCount}
          </p>
          {totalPages > 1 && (
            <Pagination
              totalPages={totalPages}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
            />
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingBlogId ? 'Chinh sua blog' : 'Tao blog moi'}
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                onClick={handleCloseForm}
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tieu de
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => handleFormChange('title', event.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nhap tieu de bai viet"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Noi dung
                </label>
                <div className="border rounded-lg overflow-hidden">
                  <CKEditor
                    editor={ClassicEditor}
                    data={formData.content}
                    onChange={(_, editor) => handleFormChange('content', editor.getData())}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Anh bai viet
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trang thai
                </label>
                <select
                  value={formData.postStatus}
                  onChange={(event) => handleFormChange('postStatus', event.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {FORM_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                onClick={handleCloseForm}
                disabled={submitting}
              >
                Huy
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Dang luu...' : (editingBlogId ? 'Cap nhat' : 'Tao moi')}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && previewBlog && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <p className="text-xs uppercase text-gray-400 tracking-wide">Preview</p>
                <h3 className="text-xl font-bold text-gray-800">{previewBlog.title}</h3>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                onClick={closePreview}
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {previewBlog.image && (
                <img
                  src={previewBlog.image}
                  alt={previewBlog.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <div className="text-sm text-gray-500 flex flex-wrap gap-2">
                <span>Trang thai: {previewBlog.postStatus}</span>
                <span>|</span>
                <span>
                  Ngay dang:{' '}
                  {previewBlog.publishedAt
                    ? new Date(previewBlog.publishedAt).toLocaleString('vi-VN')
                    : '--'}
                </span>
              </div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewBlog.content }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogManagement;
