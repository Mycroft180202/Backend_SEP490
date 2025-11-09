import React, { useState } from 'react';
import { FaEye, FaBan, FaUnlock, FaSearch, FaUserCheck, FaUserTimes } from 'react-icons/fa';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', phone: '0912345678', totalOrders: 15, totalSpent: 12500000, joinDate: '2024-01-15', status: 'active', verified: true },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@gmail.com', phone: '0923456789', totalOrders: 8, totalSpent: 5600000, joinDate: '2024-02-20', status: 'active', verified: true },
    { id: 3, name: 'Lê Văn C', email: 'levanc@gmail.com', phone: '0934567890', totalOrders: 23, totalSpent: 18900000, joinDate: '2024-01-10', status: 'active', verified: true },
    { id: 4, name: 'Phạm Thị D', email: 'phamthid@gmail.com', phone: '0945678901', totalOrders: 3, totalSpent: 2400000, joinDate: '2024-08-05', status: 'inactive', verified: false },
    { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@gmail.com', phone: '0956789012', totalOrders: 12, totalSpent: 9800000, joinDate: '2024-03-12', status: 'active', verified: true },
    { id: 6, name: 'Vũ Thị F', email: 'vuthif@gmail.com', phone: '0967890123', totalOrders: 6, totalSpent: 4200000, joinDate: '2024-05-22', status: 'active', verified: true },
    { id: 7, name: 'Đặng Văn G', email: 'dangvang@gmail.com', phone: '0978901234', totalOrders: 19, totalSpent: 15600000, joinDate: '2024-02-08', status: 'active', verified: true },
    { id: 8, name: 'Bùi Thị H', email: 'buithih@gmail.com', phone: '0989012345', totalOrders: 0, totalSpent: 0, joinDate: '2024-10-15', status: 'blocked', verified: false },
    { id: 9, name: 'Trương Văn I', email: 'truongvani@gmail.com', phone: '0901234567', totalOrders: 28, totalSpent: 24500000, joinDate: '2023-12-05', status: 'active', verified: true },
    { id: 10, name: 'Lý Thị K', email: 'lythik@gmail.com', phone: '0912345670', totalOrders: 11, totalSpent: 8700000, joinDate: '2024-04-18', status: 'active', verified: true },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      case 'blocked':
        return 'Đã khóa';
      default:
        return status;
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       customer.phone.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || customer.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    blocked: customers.filter(c => c.status === 'blocked').length,
    verified: customers.filter(c => c.verified).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tổng khách hàng</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Đang hoạt động</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <p className="text-sm text-gray-600">Không hoạt động</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Đã khóa</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.blocked}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Đã xác thực</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.verified}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý khách hàng</h2>
            <p className="text-sm text-gray-600 mt-1">Quản lý thông tin và hoạt động của khách hàng</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tên, email, số điện thoại..."
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
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="blocked">Đã khóa</option>
          </select>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Khách hàng</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Số điện thoại</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tổng đơn</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tổng chi tiêu</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Ngày tham gia</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-semibold text-gray-700">#{customer.id}</td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{customer.name}</p>
                        {customer.verified && (
                          <FaUserCheck className="text-blue-500" title="Đã xác thực" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{customer.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">{customer.phone}</td>
                  <td className="py-3 px-4 text-sm text-center font-semibold">{customer.totalOrders}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-green-600">{formatCurrency(customer.totalSpent)}</td>
                  <td className="py-3 px-4 text-sm">{customer.joinDate}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(customer.status)}`}>
                      {getStatusText(customer.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800" title="Xem chi tiết">
                        <FaEye />
                      </button>
                      {customer.status === 'blocked' ? (
                        <button className="text-green-600 hover:text-green-800" title="Mở khóa">
                          <FaUnlock />
                        </button>
                      ) : (
                        <button className="text-red-600 hover:text-red-800" title="Khóa tài khoản">
                          <FaBan />
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
            Hiển thị {filteredCustomers.length} trên tổng {customers.length} khách hàng
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

export default CustomerManagement;
