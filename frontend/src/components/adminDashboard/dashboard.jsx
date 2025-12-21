import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { 
  FaHome,
  FaProductHunt,
  FaClipboardList,
  FaUsersCog,
  FaBlog,
  FaChartBar,
  FaUsers,
  FaTicketAlt,
  FaListUl,
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
import VoucherManagement from './VoucherManagement';
import ProductCollectionManagement from './ProductCollectionManagement';
import CategoryManagement from './CategoryManagement';
import { UserContext } from '../../context/UserContext';
import AdminDashboardService from '../../services/modules/admin/adminDashboardService.jsx';

const AdminDashboard = () => {
  const { userInfo } = useContext(UserContext);
  const availableYears = useMemo(() => [2025, 2026, 2027], []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const realtimeRefreshTimeoutRef = useRef(null);
  const [overview, setOverview] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    monthRevenue: 0,
    monthGrowthPercent: 0,
    totalSellers: 0,
    totalCustomers: 0,
    reportCount: 0,
  });
  const [monthlyMetrics, setMonthlyMetrics] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const defaultYear = availableYears.includes(currentYear)
      ? currentYear
      : availableYears[0];
    return { year: defaultYear, month: now.getMonth() + 1 };
  });

  const loadDashboardData = useCallback(async (period) => {
    setLoading(true);
    try {
      const year = period?.year || new Date().getFullYear();
      const month = period?.month || new Date().getMonth() + 1;
      const [
        todayRevenueData,
        monthlyRevenueData,
        artisansData,
        customersData,
        reportNumber,
      ] = await Promise.all([
        AdminDashboardService.getTodayRevenue(),
        AdminDashboardService.getMonthlyRevenue(year),
        AdminDashboardService.getAllArtisans(),
        AdminDashboardService.getAllCustomers(),
        AdminDashboardService.getReportNumber(),
      ]);

      const monthlyList = Array.isArray(monthlyRevenueData) ? monthlyRevenueData : [];
      const currentMonthData = monthlyList.find((item) => item.month === month) || {};
      const previousMonth = month === 1 ? null : month - 1;
      const prevMonthData = previousMonth ? monthlyList.find((item) => item.month === previousMonth) : null;

      const calculateGrowthPercent = (currentValue, previousValue) => {
        if (!previousValue && !currentValue) return 0;
        if (!previousValue) return 100;
        const growth = ((currentValue - previousValue) / previousValue) * 100;
        return Number.isFinite(growth) ? Number(growth.toFixed(1)) : 0;
      };

      setOverview({
        todayRevenue: Number(todayRevenueData?.revenue) || 0,
        todayOrders: Number(todayRevenueData?.orderNumber) || 0,
        monthRevenue: Number(currentMonthData?.revenue) || 0,
        monthGrowthPercent: calculateGrowthPercent(
          Number(currentMonthData?.revenue) || 0,
          Number(prevMonthData?.revenue) || 0,
        ),
        totalSellers: artisansData?.totalCount || 0,
        totalCustomers: customersData?.totalCount || 0,
        reportCount: Number(reportNumber) || 0,
      });

      const normalizedMonthly = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const entry = monthlyList.find((item) => item.month === month) || {};
        return {
          month,
          revenue: Number(entry.revenue) || 0,
          orders: Number(entry.totalOrderNumber ?? entry.totalOrderAmount ?? 0) || 0,
        };
      });

      setMonthlyMetrics(normalizedMonthly);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Không thể tải dữ liệu tổng quan');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNavigate = useCallback((tabId) => {
    if (typeof tabId === 'string') {
      setActiveTab(tabId);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(selectedPeriod);
  }, [loadDashboardData, selectedPeriod]);

  const scheduleOverviewRefresh = useCallback(() => {
    if (activeTab !== 'overview') {
      return;
    }
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }
    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      loadDashboardData(selectedPeriod);
    }, 500);
  }, [activeTab, loadDashboardData, selectedPeriod]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handler = () => scheduleOverviewRefresh();
    window.addEventListener('realtime:notificationReceived', handler);
    window.addEventListener('realtime:productStockUpdated', handler);
    window.addEventListener('realtime:orderUpdated', handler);
    window.addEventListener('realtime:paymentUpdated', handler);
    window.addEventListener('realtime:shipmentStatusUpdated', handler);

    return () => {
      window.removeEventListener('realtime:notificationReceived', handler);
      window.removeEventListener('realtime:productStockUpdated', handler);
      window.removeEventListener('realtime:orderUpdated', handler);
      window.removeEventListener('realtime:paymentUpdated', handler);
      window.removeEventListener('realtime:shipmentStatusUpdated', handler);
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }
    };
  }, [scheduleOverviewRefresh]);

  const menuItems = [
    { id: 'overview', icon: FaHome, label: 'Tổng quan', path: '/admin' },
    { id: 'sellers', icon: FaUsers, label: 'Người bán', path: '/admin/sellers' },
    { id: 'products', icon: FaProductHunt, label: 'Sản phẩm', path: '/admin/products' },
    { id: 'categories', icon: FaListUl, label: 'Danh mục', path: '/admin/categories' },
    { id: 'orders', icon: FaClipboardList, label: 'Đơn hàng', path: '/admin/orders' },
    { id: 'customers', icon: FaUsersCog, label: 'Khách hàng', path: '/admin/customers' },
    { id: 'vouchers', icon: FaTicketAlt, label: 'Voucher', path: '/admin/vouchers' },
    { id: 'collections', icon: FaTicketAlt, label: 'Bộ sưu tập sản phẩm', path: '/admin/collections' },
    { id: 'reports', icon: FaChartBar, label: 'Báo cáo & Khiếu nại', path: '/admin/reports' },
    { id: 'blog', icon: FaBlog, label: 'Bài viết', path: '/admin/blog' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">
      {/* Sidebar Component */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menuItems={menuItems}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#f7f9fc]">
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
              <div className="flex justify-center items-center py-16 gap-3 text-gray-600">
                <FaSpinner className="text-3xl animate-spin text-primary" />
                <span className="font-medium">Đang tải dữ liệu...</span>
              </div>
            ) : (
              <OverviewSection
                overview={overview}
                monthlyData={monthlyMetrics}
                selectedYear={selectedPeriod.year}
                selectedMonth={selectedPeriod.month}
                onChangePeriod={setSelectedPeriod}
                availableYears={availableYears}
                onNavigate={handleNavigate}
              />
            )
          )}

          {activeTab === 'products' && <ProductManagement />}

          {activeTab === 'categories' && <CategoryManagement />}

          {activeTab === 'orders' && <OrderManagement />}

          {activeTab === 'customers' && <CustomerManagement />}
          
          {activeTab === 'vouchers' && <VoucherManagement />}

          {activeTab === 'collections' && <ProductCollectionManagement />}

          {activeTab === 'sellers' && <SellerManagement />}

          {activeTab === 'reports' && <ReportManagement />}

          {activeTab === 'blog' && <BlogManagement />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
