import React, { useState, useEffect } from 'react';
import { 
  FaHome,
  FaProductHunt,
  FaClipboardList,
  FaUsersCog,
  FaBlog,
  FaCog,
  FaSearch,
  FaChartBar,
  FaUsers,
  FaTicketAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import OverviewSection from './OverviewSection';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import CustomerManagement from './CustomerManagement';
import SellerManagement from './SellerManagement';
import ReportManagement from './ReportManagement';
import BlogManagement from './BlogManagement';
import SettingsManagement from './SettingsManagement';
import VoucherManagement from './VoucherManagement';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalOrders: 1247,
    totalRevenue: 458750000,
    totalProducts: 156,
    totalCustomers: 892,
    totalSellers: 45,
    orderGrowth: 12.5,
    revenueGrowth: 18.3,
    productGrowth: 5.2,
    customerGrowth: 8.7
  });

  const [recentOrders, setRecentOrders] = useState([
    { id: 'ORD-001', customer: 'Nguyễn Văn A', product: 'Đèn gốm sứ thủ công', amount: 450000, status: 'Đang giao', date: '2025-11-08' },
    { id: 'ORD-002', customer: 'Trần Thị B', product: 'Bình hoa gốm', amount: 320000, status: 'Hoàn thành', date: '2025-11-08' },
    { id: 'ORD-003', customer: 'Lê Văn C', product: 'Tượng gỗ thủ công', amount: 850000, status: 'Đang xử lý', date: '2025-11-07' },
    { id: 'ORD-004', customer: 'Phạm Thị D', product: 'Khay trà gốm', amount: 280000, status: 'Hoàn thành', date: '2025-11-07' },
    { id: 'ORD-005', customer: 'Hoàng Văn E', product: 'Lọ hoa gốm sứ', amount: 380000, status: 'Đang giao', date: '2025-11-06' },
  ]);

  const [topProducts, setTopProducts] = useState([
    { name: 'Đèn gốm sứ thủ công', sales: 245, revenue: 110250000, stock: 45 },
    { name: 'Bình hoa gốm Bát Tràng', sales: 189, revenue: 60480000, stock: 32 },
    { name: 'Tượng gỗ phong thủy', sales: 156, revenue: 132600000, stock: 18 },
    { name: 'Khay trà gốm sứ', sales: 134, revenue: 37520000, stock: 67 },
    { name: 'Lọ hoa gốm thủ công', sales: 98, revenue: 37240000, stock: 23 },
  ]);

  const [reports, setReports] = useState([
    { id: 1, type: 'product', reportedBy: 'Khách hàng A', target: 'Đèn gốm sứ - Sai mô tả', reason: 'Sản phẩm không đúng với mô tả', date: '2025-11-08', status: 'pending' },
    { id: 2, type: 'seller', reportedBy: 'Khách hàng B', target: 'Gốm Bát Tràng Shop', reason: 'Giao hàng chậm, không phản hồi', date: '2025-11-07', status: 'investigating' },
    { id: 3, type: 'product', reportedBy: 'Khách hàng C', target: 'Tượng gỗ - Hàng giả', reason: 'Nghi vấn hàng giả mạo', date: '2025-11-06', status: 'resolved' },
    { id: 4, type: 'order', reportedBy: 'Khách hàng D', target: 'Đơn hàng #ORD-123', reason: 'Không nhận được hàng', date: '2025-11-05', status: 'pending' },
  ]);

const menuItems = [
    { id: 'overview', icon: FaHome, label: 'Tổng quan', path: '/admin' },
    { id: 'sellers', icon: FaUsers, label: 'Người bán', path: '/admin/sellers' },
    { id: 'products', icon: FaProductHunt, label: 'Sản phẩm', path: '/admin/products' },
    { id: 'orders', icon: FaClipboardList, label: 'Đơn hàng', path: '/admin/orders' },
    { id: 'customers', icon: FaUsersCog, label: 'Khách hàng', path: '/admin/customers' },
    { id: 'vouchers', icon: FaTicketAlt, label: 'Voucher', path: '/admin/vouchers' },
    { id: 'reports', icon: FaChartBar, label: 'Báo cáo & Khiếu nại', path: '/admin/reports' },
    { id: 'blog', icon: FaBlog, label: 'Blog', path: '/admin/blog' },
    { id: 'settings', icon: FaCog, label: 'Cài đặt', path: '/admin/settings' },
  ];

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'investigating':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Component */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menuItems={menuItems}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 font-alata">
                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-gray-600 font-nunito">Chào mừng trở lại, Admin!</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src="/images/default-avatar.png" 
                  alt="Admin" 
                  className="w-10 h-10 rounded-full border-2 border-primary"
                />
                <div className="text-right">
                  <p className="font-semibold text-sm">Admin User</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <OverviewSection 
              stats={stats}
              recentOrders={recentOrders}
              topProducts={topProducts}
              formatCurrency={formatCurrency}
              getStatusColor={getStatusColor}
            />
          )}

          {activeTab === 'products' && <ProductManagement />}

          {activeTab === 'orders' && <OrderManagement />}

          {activeTab === 'customers' && <CustomerManagement />}
          
          {activeTab === 'vouchers' && <VoucherManagement />}

          {activeTab === 'sellers' && <SellerManagement />}

          {activeTab === 'reports' && (
            <ReportManagement 
              reports={reports}
              getReportStatusColor={getReportStatusColor}
            />
          )}

          {activeTab === 'blog' && <BlogManagement />}

          {activeTab === 'settings' && <SettingsManagement />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
