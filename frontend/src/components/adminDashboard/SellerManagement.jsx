import React, { useState } from 'react';
import { FaEye, FaCheck, FaTimes, FaBan, FaUnlock, FaSearch, FaStore } from 'react-icons/fa';

const SellerManagement = () => {
  const [sellers, setSellers] = useState([
    { id: 1, name: 'Nguyễn Văn Minh', shopName: 'Gốm Sứ Bát Tràng', email: 'minhnguyen@gmail.com', phone: '0912345678', products: 45, revenue: 125000000, joinDate: '2024-01-10', status: 'approved', verified: true },
    { id: 2, name: 'Trần Thị Hương', shopName: 'Đồ Gỗ Hoa Lạc', email: 'huongtran@gmail.com', phone: '0923456789', products: 32, revenue: 89000000, joinDate: '2024-02-15', status: 'approved', verified: true },
    { id: 3, name: 'Lê Văn Tùng', shopName: 'Tranh Gỗ Thủ Công', email: 'tungle@gmail.com', phone: '0934567890', products: 28, revenue: 156000000, joinDate: '2024-01-20', status: 'approved', verified: true },
    { id: 4, name: 'Phạm Thị Mai', shopName: 'Gốm Mỹ Nghệ', email: 'maipham@gmail.com', phone: '0945678901', products: 18, revenue: 45000000, joinDate: '2024-08-12', status: 'pending', verified: false },
    { id: 5, name: 'Hoàng Văn Đức', shopName: 'Đồ Thủ Công Việt', email: 'duchoang@gmail.com', phone: '0956789012', products: 52, revenue: 198000000, joinDate: '2024-03-05', status: 'approved', verified: true },
    { id: 6, name: 'Vũ Thị Lan', shopName: 'Gốm Sứ Cao Cấp', email: 'lanvu@gmail.com', phone: '0967890123', products: 0, revenue: 0, joinDate: '2024-10-20', status: 'pending', verified: false },
    { id: 7, name: 'Đặng Văn Hải', shopName: 'Nghệ Thuật Gỗ', email: 'haidang@gmail.com', phone: '0978901234', products: 38, revenue: 142000000, joinDate: '2024-04-08', status: 'approved', verified: true },
    { id: 8, name: 'Bùi Thị Nga', shopName: 'Gốm Truyền Thống', email: 'ngabui@gmail.com', phone: '0989012345', products: 15, revenue: 32000000, joinDate: '2024-06-15', status: 'blocked', verified: true },
    { id: 9, name: 'Trương Văn Quân', shopName: 'Đồ Gỗ Mỹ Nghệ', email: 'quantruong@gmail.com', phone: '0901234567', products: 41, revenue: 167000000, joinDate: '2024-02-20', status: 'approved', verified: true },
    { id: 10, name: 'Lý Thị Hoa', shopName: 'Thủ Công Hoa Lạc', email: 'hoaly@gmail.com', phone: '0912345670', products: 0, revenue: 0, joinDate: '2024-11-01', status: 'pending', verified: false },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Đã duyệt';
      case 'pending':
        return 'Chờ duyệt';
      case 'blocked':
        return 'Đã khóa';
      default:
        return status;
    }
  };

  const filteredSellers = sellers.filter(seller => {
    const matchSearch = seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       seller.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       seller.phone.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || seller.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: sellers.length,
    approved: sellers.filter(s => s.status === 'approved').length,
    pending: sellers.filter(s => s.status === 'pending').length,
    blocked: sellers.filter(s => s.status === 'blocked').length,
    totalRevenue: sellers.reduce((sum, s) => sum + s.revenue, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tổng nghệ nhân</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Đã duyệt</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Chờ duyệt</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Đã khóa</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.blocked}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Tổng doanh thu</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{formatCurrency(stats.totalRevenue)}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý nghệ nhân</h2>
            <p className="text-sm text-gray-600 mt-1">Quản lý và phê duyệt tài khoản nghệ nhân</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tên nghệ nhân, tên cửa hàng, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending">Chờ duyệt</option>
            <option value="blocked">Đã khóa</option>
          </select>
        </div>

        {/* Sellers Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Nghệ nhân</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Cửa hàng</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Liên hệ</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Sản phẩm</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Doanh thu</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Ngày tham gia</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.map((seller) => (
                <tr key={seller.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-semibold text-gray-700">#{seller.id}</td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-semibold">{seller.name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FaStore className="text-primary" />
                      <p className="text-sm font-semibold">{seller.shopName}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-xs text-gray-500">{seller.email}</p>
                      <p className="text-xs text-gray-500">{seller.phone}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-center font-semibold">{seller.products}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-green-600">{formatCurrency(seller.revenue)}</td>
                  <td className="py-3 px-4 text-sm">{seller.joinDate}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(seller.status)}`}>
                      {getStatusText(seller.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800" title="Xem chi tiết">
                        <FaEye />
                      </button>
                      {seller.status === 'pending' && (
                        <>
                          <button className="text-green-600 hover:text-green-800" title="Phê duyệt">
                            <FaCheck />
                          </button>
                          <button className="text-red-600 hover:text-red-800" title="Từ chối">
                            <FaTimes />
                          </button>
                        </>
                      )}
                      {seller.status === 'approved' && (
                        <button className="text-red-600 hover:text-red-800" title="Khóa tài khoản">
                          <FaBan />
                        </button>
                      )}
                      {seller.status === 'blocked' && (
                        <button className="text-green-600 hover:text-green-800" title="Mở khóa">
                          <FaUnlock />
                        </button>
                      )}
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
            Hiển thị {filteredSellers.length} trên tổng {sellers.length} nghệ nhân
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

export default SellerManagement;
