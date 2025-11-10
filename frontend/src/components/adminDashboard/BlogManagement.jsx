import React, { useEffect, useMemo, useState } from 'react';
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

const statusOptions = [
  { value: 'draft', label: 'Bản nháp' },
  { value: 'published', label: 'Xuất bản' },
];

const emptyForm = {
  id: null,
  title: '',
  summary: '',
  content: '',
  status: 'draft',
  tags: '',
  coverImage: null,
  coverImageUrl: '',
};

const BlogManagement = ({ isAdmin = true }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(formData.id);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const response = await BlogService.getAll();
      setBlogs(response.items);
    } catch (error) {
      console.error('Load blogs error:', error);
      toast.error(
        error?.response?.data?.message
          || error?.message
          || 'Không thể tải danh sách blog.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(
    () => [...new Set(blogs.map((blog) => blog.category).filter(Boolean))],
    [blogs],
  );

  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchSearch = searchTerm
        ? (blog.title || '').toLowerCase().includes(searchTerm.toLowerCase())
          || (blog.author || '').toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchStatus = statusFilter === 'all' || blog.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || blog.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [blogs, searchTerm, statusFilter, categoryFilter]);

  const stats = useMemo(() => ({
    total: blogs.length,
    published: blogs.filter((b) => b.status === 'published').length,
    draft: blogs.filter((b) => b.status === 'draft').length,
    totalViews: blogs.reduce((sum, b) => sum + (b.views || 0), 0),
  }), [blogs]);

  const handleOpenModal = (blog = null) => {
    if (!isAdmin) {
      toast.warn('Bạn không có quyền tạo/chỉnh sửa blog.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }

    if (blog) {
      setFormData({
        id: blog.id,
        title: blog.title || '',
        summary: blog.summary || '',
        content: blog.content || '',
        status: blog.status || 'draft',
        tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || ''),
        coverImage: null,
        coverImageUrl: blog.coverImageUrl || blog.thumbnail || '',
      });
      if (blog.coverImageUrl || blog.thumbnail) {
        setPreviewUrl(blog.coverImageUrl || blog.thumbnail);
      }
    } else {
      setFormData(emptyForm);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormData(emptyForm);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData((prev) => ({
        ...prev,
        coverImage: file,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài viết.');
      return false;
    }
    if (!formData.content.trim()) {
      toast.error('Nội dung bài viết chưa được nhập.');
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const payload = new FormData();
    payload.append('title', formData.title.trim());
    payload.append('summary', formData.summary.trim());
    payload.append('content', formData.content);
    payload.append('status', formData.status);
    payload.append('tags', formData.tags);

    if (formData.coverImage instanceof File) {
      payload.append('coverImage', formData.coverImage);
    } else if (formData.coverImageUrl) {
      payload.append('coverImageUrl', formData.coverImageUrl);
    }

    // Ghi chú cho backend: cần hỗ trợ các field trên (title, summary, content,
    // status, tags, coverImage/coverImageUrl). Nếu muốn lưu category, thêm input
    // và append tương ứng.

    return payload;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEditing) {
        await BlogService.update(formData.id, payload);
        toast.success('Đã cập nhật blog thành công.');
      } else {
        await BlogService.create(payload);
        toast.success('Đã tạo blog mới thành công.');
      }
      handleCloseModal();
      loadBlogs();
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

  const handleDelete = async (blog) => {
    toast.info('API hiện chưa hỗ trợ xóa blog. Vui lòng cập nhật backend nếu cần.');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Tổng lượt xem</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalViews.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tất cả trạng thái</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
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
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4 text-center">Lượt xem</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Ngày cập nhật</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    Không tìm thấy bài viết nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {blog.coverImageUrl && (
                          <img
                            src={blog.coverImageUrl}
                            alt={blog.title}
                            className="w-12 h-12 rounded object-cover border"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                            {blog.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            #{blog.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {blog.author || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                        {blog.category || 'Khác'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-center font-semibold">
                      {(blog.views || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          blog.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {blog.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-center text-gray-500">
                      {blog.updatedAt
                        ? new Date(blog.updatedAt).toLocaleDateString('vi-VN')
                        : (blog.createdAt
                          ? new Date(blog.createdAt).toLocaleDateString('vi-VN')
                          : '—')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800"
                          title="Xem trước"
                          onClick={() => toast.info('Chức năng xem trước đang phát triển.')}
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          className="text-green-600 hover:text-green-800"
                          title="Chỉnh sửa"
                          onClick={() => handleOpenModal(blog)}
                          disabled={!isAdmin}
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800"
                          title="Xóa"
                          onClick={() => handleDelete(blog)}
                          disabled={!isAdmin}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-semibold text-[#8B4513]">
                {isEditing ? 'Chỉnh sửa blog' : 'Tạo blog mới'}
              </h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={handleCloseModal}
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tiêu đề
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(event) => handleInputChange('title', event.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nhập tiêu đề hấp dẫn..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tóm tắt
                    </label>
                    <textarea
                      value={formData.summary}
                      onChange={(event) => handleInputChange('summary', event.target.value)}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Viết tóm tắt ngắn gọn cho bài viết..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      value={formData.status}
                      onChange={(event) => handleInputChange('status', event.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tags (phân cách bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(event) => handleInputChange('tags', event.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Thủ công, gốm sứ, lưu niệm..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ảnh đại diện
                    </label>
                    <div className="border border-dashed border-[#D4A574] rounded-lg p-4 text-center">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                      ) : (
                        <p className="text-sm text-gray-500 mb-4">
                          Chưa chọn ảnh, vui lòng tải lên hình ảnh minh họa cho bài viết.
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
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nội dung bài viết
                </label>
                <div className="border rounded-lg overflow-hidden">
                  <CKEditor
                    editor={ClassicEditor}
                    data={formData.content}
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
                        '|',
                        'insertTable',
                        'undo',
                        'redo',
                      ],
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
                {saving ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Tạo mới')}
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
