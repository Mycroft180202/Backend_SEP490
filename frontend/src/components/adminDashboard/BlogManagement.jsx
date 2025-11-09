import React, { useState } from 'react';
import { FaEye, FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([
    { id: 1, title: 'Bí quyết làm gốm sứ truyền thống', author: 'Nguyễn Văn A', category: 'Hướng dẫn', views: 1250, date: '2025-11-05', status: 'published', image: '/images/blog1.jpg' },
    { id: 2, title: 'Khám phá làng nghề Hoa Lạc', author: 'Trần Thị B', category: 'Khám phá', views: 890, date: '2025-11-04', status: 'published', image: '/images/blog2.jpg' },
    { id: 3, title: '10 sản phẩm thủ công đẹp nhất', author: 'Lê Văn C', category: 'Top 10', views: 2100, date: '2025-11-03', status: 'published', image: '/images/blog3.jpg' },
    { id: 4, title: 'Cách chọn quà tặng thủ công ý nghĩa', author: 'Phạm Thị D', category: 'Mẹo hay', views: 670, date: '2025-11-02', status: 'published', image: '/images/blog4.jpg' },
    { id: 5, title: 'Nghệ thuật chạm khắc gỗ', author: 'Hoàng Văn E', category: 'Hướng dẫn', views: 540, date: '2025-11-01', status: 'draft', image: '/images/blog5.jpg' },
    { id: 6, title: 'Lịch sử gốm sứ Việt Nam', author: 'Vũ Thị F', category: 'Lịch sử', views: 1350, date: '2025-10-30', status: 'published', image: '/images/blog6.jpg' },
    { id: 7, title: 'Đồ gỗ mỹ nghệ cao cấp', author: 'Đặng Văn G', category: 'Sản phẩm', views: 0, date: '2025-10-29', status: 'draft', image: '/images/blog7.jpg' },
    { id: 8, title: 'Xu hướng trang trí nhà cửa 2025', author: 'Bùi Thị H', category: 'Xu hướng', views: 1890, date: '2025-10-28', status: 'published', image: '/images/blog8.jpg' },
    { id: 9, title: 'Hội chợ thủ công mỹ nghệ Hà Nội', author: 'Trương Văn I', category: 'Sự kiện', views: 730, date: '2025-10-27', status: 'published', image: '/images/blog9.jpg' },
    { id: 10, title: 'Bảo quản sản phẩm gốm sứ đúng cách', author: 'Lý Thị K', category: 'Mẹo hay', views: 0, date: '2025-10-26', status: 'draft', image: '/images/blog10.jpg' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published':
        return 'Đã xuất bản';
      case 'draft':
        return 'Bản nháp';
      default:
        return status;
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       blog.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || blog.status === filterStatus;
    const matchCategory = filterCategory === 'all' || blog.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.status === 'published').length,
    draft: blogs.filter(b => b.status === 'draft').length,
    totalViews: blogs.reduce((sum, b) => sum + b.views, 0),
  };

  const categories = [...new Set(blogs.map(b => b.category))];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tổng bài viết</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Đã xuất bản</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.published}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <p className="text-sm text-gray-600">Bản nháp</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Tổng lượt xem</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalViews.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý blog</h2>
            <p className="text-sm text-gray-600 mt-1">Quản lý nội dung bài viết và blog</p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            <FaPlus /> Tạo bài viết mới
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tiêu đề, tác giả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
          </select>
        </div>

        {/* Blogs Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tiêu đề</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tác giả</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Danh mục</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Lượt xem</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Ngày đăng</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.map((blog) => (
                <tr key={blog.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-semibold text-gray-700">#{blog.id}</td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2">{blog.title}</p>
                  </td>
                  <td className="py-3 px-4 text-sm">{blog.author}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      {blog.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-center font-semibold">{blog.views.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm">{blog.date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(blog.status)}`}>
                      {getStatusText(blog.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800" title="Xem">
                        <FaEye />
                      </button>
                      <button className="text-green-600 hover:text-green-800" title="Chỉnh sửa">
                        <FaEdit />
                      </button>
                      <button className="text-red-600 hover:text-red-800" title="Xóa">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hiển thị {filteredBlogs.length} trên tổng {blogs.length} bài viết
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Trước</button>
            <button className="px-4 py-2 bg-primary text-white rounded-lg">1</button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">2</button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;
