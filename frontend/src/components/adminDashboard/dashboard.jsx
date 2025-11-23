import React, { useState, useEffect, useContext } from 'react';
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
  FaTicketAlt,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-toastify';
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
import ProductCollectionManagement from './ProductCollectionManagement';
import { UserContext } from '../../context/UserContext';
import AdminDashboardService from '../../services/modules/admin/adminDashboardService.jsx';
import { UserService } from '../../services/modules/users/userService';

const AdminDashboard = () => {
  const { userInfo } = useContext(UserContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalSellers: 0,
    totalCustomers: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [reports] = useState([
    { id: 1, type: 'product', reportedBy: 'Khách hàng A', target: 'Đèn gốm sứ - Sai mô tả', reason: 'Sản phẩm không đúng với mô tả', date: '2025-11-08', status: 'pending' },
    { id: 2, type: 'seller', reportedBy: 'Khách hàng B', target: 'Gốm Bát Tràng Shop', reason: 'Giao hàng chậm, không phản hồi', date: '2025-11-07', status: 'investigating' },
    { id: 3, type: 'product', reportedBy: 'Khách hàng C', target: 'Tượng gỗ - Hàng giả', reason: 'Nghi vấn hàng giả mạo', date: '2025-11-06', status: 'resolved' },
    { id: 4, type: 'order', reportedBy: 'Khách hàng D', target: 'Đơn hàng #ORD-123', reason: 'Không nhận được hàng', date: '2025-11-05', status: 'pending' },
  ]);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const currentYear = new Date().getFullYear();
      const [ordersData, artisansData, customersData, newestOrdersData, topProductsData, monthlyRevenueData] = await Promise.all([
        AdminDashboardService.getAllOrders(),
        AdminDashboardService.getAllArtisans(),
        AdminDashboardService.getAllCustomers(),
        AdminDashboardService.getNewestOrders(),
        AdminDashboardService.getTopProducts(),
        AdminDashboardService.getMonthlyRevenue(currentYear),
      ]);

      // Calculate stats
      const totalOrders = ordersData?.totalCount || 0;
      // Calculate total revenue from monthly data (sum all months)
      const totalRevenue = (monthlyRevenueData || []).reduce((sum, month) => sum + (month.revenue || 0), 0);
      const totalSellers = artisansData?.totalCount || 0;
      const totalCustomers = customersData?.totalCount || 0;

      // Debug logs
      console.log('monthlyRevenueData:', monthlyRevenueData);
      console.log('totalRevenue from monthly:', totalRevenue);
      console.log('newestOrdersData:', newestOrdersData);
      console.log('newestOrdersData[0]:', newestOrdersData?.[0]);
      console.log('customersData:', customersData);
      console.log('customersData.items[0]:', customersData?.items?.[0]);

      setStats({
        totalOrders,
        totalRevenue,
        totalSellers,
        totalCustomers
      });

      // Get detailed info for recent orders
      const orderDetailsPromises = (newestOrdersData || []).map(order =>
        AdminDashboardService.getOrderDetail(order.orderNumber)
      );
      const orderDetails = await Promise.all(orderDetailsPromises);

      console.log('orderDetails:', orderDetails);

      // Get user info for customers in orders (get customer ID from orders)
      const customerIds = orderDetails
        .map(detail => detail?.customerId)
        .filter(Boolean)
        .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

      const userInfoPromises = customerIds.map(customerId =>
        UserService.getById(customerId).catch(err => {
          console.error(`Failed to get user ${customerId}:`, err);
          return null;
        })
      );
      const userInfoMap = new Map();
      const userInfos = await Promise.all(userInfoPromises);
      customerIds.forEach((id, index) => {
        if (userInfos[index]) {
          userInfoMap.set(id, userInfos[index]);
        }
      });

      console.log('userInfoMap:', userInfoMap);

      // Transform recent orders for display with full details
      const recentOrdersForDisplay = (newestOrdersData || []).map((order, index) => {
        const orderDetail = orderDetails[index];
        const customerId = orderDetail?.customerId;
        const userInfo = customerId ? userInfoMap.get(customerId) : null;
        
        // Get customer name from userInfo first, then fallback to orderDetail
        let customerName = userInfo?.displayName || 
                          userInfo?.fullName || 
                          userInfo?.name || 
                          userInfo?.username ||
                          orderDetail?.customer?.fullName || 
                          orderDetail?.customer?.name || 
                          order.customerName || 
                          customerId;
        
        // Get product count from order detail items
        const productCount = orderDetail?.items?.length || order.items?.length || 0;
        
        console.log(`Order ${order.orderNumber}: customer="${customerName}", products=${productCount}`);
        
        return {
          id: order.orderNumber,
          customer: customerName,
          productCount: productCount,
          amount: orderDetail?.totalAmount || order.totalAmount || 0,
          status: orderDetail?.status || order.status,
          date: new Date(orderDetail?.createAt || order.createAt).toLocaleDateString('vi-VN'),
          rowNumber: index + 1
        };
      });
      setRecentOrders(recentOrdersForDisplay);

      // Transform top products for display
      const topProductsForDisplay = (topProductsData || []).map(item => ({
        name: item.product?.name || 'Unknown',
        sales: item.totalSold || 0,
        revenue: item.totalAmmount || 0,
        stock: item.product?.stock || 0
      }));
      setTopProducts(topProductsForDisplay);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

const menuItems = [
    { id: 'overview', icon: FaHome, label: 'Tổng quan', path: '/admin' },
    { id: 'sellers', icon: FaUsers, label: 'Người bán', path: '/admin/sellers' },
    { id: 'products', icon: FaProductHunt, label: 'Sản phẩm', path: '/admin/products' },
    { id: 'orders', icon: FaClipboardList, label: 'Đơn hàng', path: '/admin/orders' },
    { id: 'customers', icon: FaUsersCog, label: 'Khách hàng', path: '/admin/customers' },
    { id: 'vouchers', icon: FaTicketAlt, label: 'Voucher', path: '/admin/vouchers' },
    { id: 'collections', icon: FaTicketAlt, label: 'Bộ sưu tập', path: '/admin/collections' },
    { id: 'reports', icon: FaChartBar, label: 'Báo cáo & Khiếu nại', path: '/admin/reports' },
    { id: 'blog', icon: FaBlog, label: 'Blog', path: '/admin/blog' },
    { id: 'settings', icon: FaCog, label: 'Cài đặt', path: '/admin/settings' },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Delivered':
        return 'bg-blue-100 text-blue-800';
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
                  src={userInfo?.userUrlImage || '/images/default-avatar.png'} 
                  alt={userInfo?.displayName || userInfo?.username || 'Admin'} 
                  className="w-10 h-10 rounded-full border-2 border-primary"
                />
                <div className="text-right">
                  <p className="font-semibold text-sm">{userInfo?.displayName || userInfo?.username || 'Admin User'}</p>
                  <p className="text-xs text-gray-500">
                    {(userInfo?.roles || [])
                      .map((r) => (typeof r === 'string' ? r : r?.name))
                      .filter(Boolean)
                      .join(', ') || 'Administrator'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            loading ? (
              <div className="flex justify-center items-center py-16">
                <FaSpinner className="animate-spin text-primary text-3xl" />
                <span className="ml-4 text-gray-600 font-medium">Đang tải dữ liệu...</span>
              </div>
            ) : (
              <OverviewSection 
                stats={stats}
                recentOrders={recentOrders}
                topProducts={topProducts}
                formatCurrency={formatCurrency}
                getStatusColor={getStatusColor}
              />
            )
          )}

          {activeTab === 'products' && <ProductManagement />}

          {activeTab === 'orders' && <OrderManagement />}

          {activeTab === 'customers' && <CustomerManagement />}
          
          {activeTab === 'vouchers' && <VoucherManagement />}

          {activeTab === 'collections' && <ProductCollectionManagement />}

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
