import React, { useState } from 'react';
import { 
  FaHome,
  FaProductHunt,
  FaClipboardList,
  FaChartLine,
  FaCog,
  FaSearch
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import OverviewSection from './OverviewSection';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import RevenueManagement from './RevenueManagement';
import SettingsManagement from './SettingsManagement';

const ArtisanDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [stats, setStats] = useState({
    totalProducts: 42,
    totalOrders: 156,
    totalRevenue: 89750000,
    rating: 4.8,
    totalReviews: 234,
    productGrowth: 8.5,
    orderGrowth: 15.3,
    revenueGrowth: 22.7
  });

  const [recentOrders, setRecentOrders] = useState([
    { id: 'ORD-001', customer: 'Nguyễn Văn A', product: 'Đèn gốm sứ thủ công', amount: 450000, status: 'Đang giao', date: '2025-11-08' },
    { id: 'ORD-002', customer: 'Trần Thị B', product: 'Bình hoa gốm', amount: 320000, status: 'Hoàn thành', date: '2025-11-08' },
    { id: 'ORD-003', customer: 'Lê Văn C', product: 'Tượng gỗ thủ công', amount: 850000, status: 'Đang xử lý', date: '2025-11-07' },
    { id: 'ORD-004', customer: 'Phạm Thị D', product: 'Khay trà gốm', amount: 280000, status: 'Hoàn thành', date: '2025-11-07' },
    { id: 'ORD-005', customer: 'Hoàng Văn E', product: 'Lọ hoa gốm sứ', amount: 380000, status: 'Đang giao', date: '2025-11-06' },
  ]);

  const [topProducts, setTopProducts] = useState([
    { name: 'Đèn gốm sứ thủ công', sales: 156, revenue: 70200000, stock: 45 },
    { name: 'Bình hoa gốm Bát Tràng', sales: 142, revenue: 45440000, stock: 32 },
    { name: 'Khay trà gốm sứ', sales: 234, revenue: 65520000, stock: 67 },
    { name: 'Lọ hoa gốm thủ công', sales: 87, revenue: 33060000, stock: 23 },
    { name: 'Chén gốm hoa văn', sales: 198, revenue: 35640000, stock: 89 },
  ]);

  const menuItems = [
    { id: 'overview', icon: FaHome, label: 'Tổng quan', path: '/artisan' },
    { id: 'products', icon: FaProductHunt, label: 'Sản phẩm', path: '/artisan/products' },
    { id: 'orders', icon: FaClipboardList, label: 'Đơn hàng', path: '/artisan/orders' },
    { id: 'revenue', icon: FaChartLine, label: 'Doanh thu', path: '/artisan/revenue' },
    { id: 'settings', icon: FaCog, label: 'Cài đặt', path: '/artisan/settings' },
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
              <p className="text-gray-600 font-nunito">Chào mừng trở lại, Người bán!</p>
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
                  alt="Seller" 
                  className="w-10 h-10 rounded-full border-2 border-primary"
                />
                <div className="text-right">
                  <p className="font-semibold text-sm">Gốm Bát Tràng</p>
                  <p className="text-xs text-gray-500">Người bán</p>
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

          {activeTab === 'revenue' && <RevenueManagement />}

          {activeTab === 'settings' && <SettingsManagement />}
        </div>
      </main>
    </div>
  );
};

export default ArtisanDashboard;
