import React, { useState } from 'react';
import { FaEye, FaEdit, FaSearch, FaFilter, FaFileExport } from 'react-icons/fa';

const OrderManagement = () => {
  const [orders, setOrders] = useState([
    { id: 'ORD-001', customer: 'Nguyễn Văn A', phone: '0912345678', product: 'Đèn gốm sứ thủ công', quantity: 2, amount: 900000, status: 'Đang giao', date: '2025-11-08', payment: 'Đã thanh toán' },
    { id: 'ORD-002', customer: 'Trần Thị B', phone: '0923456789', product: 'Bình hoa gốm', quantity: 1, amount: 320000, status: 'Hoàn thành', date: '2025-11-08', payment: 'Đã thanh toán' },
    { id: 'ORD-003', customer: 'Lê Văn C', phone: '0934567890', product: 'Tượng gỗ thủ công', quantity: 1, amount: 850000, status: 'Đang xử lý', date: '2025-11-07', payment: 'Chưa thanh toán' },
    { id: 'ORD-004', customer: 'Phạm Thị D', phone: '0945678901', product: 'Khay trà gốm', quantity: 3, amount: 840000, status: 'Hoàn thành', date: '2025-11-07', payment: 'Đã thanh toán' },
    { id: 'ORD-005', customer: 'Hoàng Văn E', phone: '0956789012', product: 'Lọ hoa gốm sứ', quantity: 2, amount: 760000, status: 'Đang giao', date: '2025-11-06', payment: 'Đã thanh toán' },
    { id: 'ORD-006', customer: 'Vũ Thị F', phone: '0967890123', product: 'Tranh gỗ chạm khắc', quantity: 1, amount: 1200000, status: 'Đang xử lý', date: '2025-11-06', payment: 'Đã thanh toán' },
    { id: 'ORD-007', customer: 'Đặng Văn G', phone: '0978901234', product: 'Bộ ấm trà gốm', quantity: 1, amount: 650000, status: 'Hoàn thành', date: '2025-11-05', payment: 'Đã thanh toán' },
    { id: 'ORD-008', customer: 'Bùi Thị H', phone: '0989012345', product: 'Chén gốm hoa văn', quantity: 5, amount: 900000, status: 'Đã hủy', date: '2025-11-05', payment: 'Hoàn tiền' },
    { id: 'ORD-009', customer: 'Trương Văn I', phone: '0901234567', product: 'Tượng Phật gỗ', quantity: 1, amount: 2500000, status: 'Đang xử lý', date: '2025-11-04', payment: 'Đã thanh toán' },
    { id: 'ORD-010', customer: 'Lý Thị K', phone: '0912345670', product: 'Khay trà gốm sứ', quantity: 2, amount: 560000, status: 'Hoàn thành', date: '2025-11-04', payment: 'Đã thanh toán' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Hoàn thành':
        return 'bg-green-100 text-green-800';
      case 'Đang giao':
        return 'bg-blue-100 text-blue-800';
      case 'Đang xử lý':
        return 'bg-yellow-100 text-yellow-800';
      case 'Đã hủy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (payment) => {
    switch (payment) {
      case 'Đã thanh toán':
        return 'bg-green-100 text-green-800';
      case 'Chưa thanh toán':
        return 'bg-orange-100 text-orange-800';
      case 'Hoàn tiền':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       order.phone.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length,
    processing: orders.filter(o => o.status === 'Đang xử lý').length,
    shipping: orders.filter(o => o.status === 'Đang giao').length,
    completed: orders.filter(o => o.status === 'Hoàn thành').length,
    cancelled: orders.filter(o => o.status === 'Đã hủy').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-600">Đang xử lý</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.processing}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
          <p className="text-sm text-gray-600">Đang giao</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.shipping}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Hoàn thành</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Đã hủy</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Quản lý đơn hàng</h2>
            <p className="text-sm text-gray-600 mt-1">Quản lý và theo dõi tất cả đơn hàng</p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            <FaFileExport /> Xuất báo cáo
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã đơn, tên khách hàng, số điện thoại..."
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
            <option value="Đang xử lý">Đang xử lý</option>
            <option value="Đang giao">Đang giao</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Đã hủy">Đã hủy</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Mã đơn</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Khách hàng</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Sản phẩm</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">SL</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Tổng tiền</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thanh toán</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Ngày</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-sm text-primary">{order.id}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-semibold">{order.customer}</p>
                      <p className="text-xs text-gray-500">{order.phone}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">{order.product}</td>
                  <td className="py-3 px-4 text-sm text-center">{order.quantity}</td>
                  <td className="py-3 px-4 text-sm font-semibold">{formatCurrency(order.amount)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentColor(order.payment)}`}>
                      {order.payment}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{order.date}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800" title="Xem chi tiết">
                        <FaEye />
                      </button>
                      <button className="text-green-600 hover:text-green-800" title="Cập nhật">
                        <FaEdit />
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
            Hiển thị {filteredOrders.length} trên tổng {orders.length} đơn hàng
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

export default OrderManagement;
