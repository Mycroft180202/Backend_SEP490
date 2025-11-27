import React, { useState, useContext, useEffect } from 'react';
import {
  FaHome,
  FaProductHunt,
  FaClipboardList,
  FaChartLine,
  FaCog,
  FaSearch,
  FaSpinner,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import OverviewSection from './OverviewSection';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import RevenueManagement from './RevenueManagement';
import SettingsManagement from './SettingsManagement';
import { UserContext } from '../../context/UserContext';
import ArtisanDashboardService from '../../services/modules/artisan/artisanDashboardService';

const ArtisanDashboard = () => {
  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    rating: 0,
    totalReviews: 0,
    productGrowth: 0,
    orderGrowth: 0,
    revenueGrowth: 0,
  });

  const [performanceRows, setPerformanceRows] = useState([]);
  const [productStats, setProductStats] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);

  const menuItems = [
    { id: 'overview', icon: FaHome, label: 'Tổng quan', path: '/artisan' },
    { id: 'products', icon: FaProductHunt, label: 'Sản phẩm', path: '/artisan/products' },
    { id: 'orders', icon: FaClipboardList, label: 'Đơn hàng', path: '/artisan/orders' },
    { id: 'revenue', icon: FaChartLine, label: 'Doanh thu', path: '/artisan/revenue' },
    { id: 'settings', icon: FaCog, label: 'Cài đặt', path: '/artisan/settings' },
  ];

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

  const loadDashboardData = async () => {
    if (!userInfo?.userID && !userInfo?.userId) {
      return;
    }
    setLoading(true);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const [productsRes, monthlyRes, weeklyRes] = await Promise.all([
        ArtisanDashboardService.getProducts({ pageIndex: 1, pageSize: 100 }),
        ArtisanDashboardService.getMonthlyRevenue(currentYear),
        ArtisanDashboardService.getWeeklyRevenue(currentYear, currentMonth),
      ]);

      const products = Array.isArray(productsRes?.items)
        ? productsRes.items
        : productsRes?.Items || [];

      const normalizedProducts = products.map((entry, index) => {
        const product = entry.product || entry.Product || {};
        return {
          id: product.id || product.Id || `product-${index}`,
          name: product.name || product.Name || 'Sản phẩm chưa đặt tên',
          shortDescription: product.shortDescription || product.ShortDescription || '',
          category: product.category || product.Category || '',
          stock: product.stock ?? product.Stock ?? 0,
          price: product.price ?? product.Price ?? 0,
          rating: product.rating ?? product.Rating ?? 0,
          sold: entry.totalSold ?? entry.TotalSold ?? 0,
          revenue: Number(entry.totalAmmount ?? entry.TotalAmmount ?? 0),
          imageUrl: product.imageUrl || product.imageURL || product.ImageUrl || '',
        };
      });

      const totalSold = normalizedProducts.reduce((sum, item) => sum + Number(item.sold || 0), 0);
      const totalRevenueAmount = normalizedProducts.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
      const avgRating = normalizedProducts.length
        ? normalizedProducts.reduce((sum, item) => sum + Number(item.rating || 0), 0) / normalizedProducts.length
        : 0;

      const monthlyData = Array.isArray(monthlyRes) ? monthlyRes : [];
      const weeklyData = Array.isArray(weeklyRes) ? weeklyRes : [];

      const findMonth = (month) => monthlyData.find((entry) => entry.month === month);
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const currentMonthData = findMonth(currentMonth) || { totalOrderAmount: 0, revenue: 0 };
      const prevMonthData = findMonth(prevMonth) || { totalOrderAmount: 0, revenue: 0 };

      const calcGrowth = (currentValue, previousValue) => {
        if (!previousValue && !currentValue) return 0;
        if (!previousValue) return 100;
        const growth = ((currentValue - previousValue) / previousValue) * 100;
        return Number.isFinite(growth) ? Number(growth.toFixed(1)) : 0;
      };

      const orderGrowthValue = calcGrowth(
        currentMonthData.totalOrderAmount || 0,
        prevMonthData.totalOrderAmount || 0,
      );
      const revenueGrowthValue = calcGrowth(
        currentMonthData.revenue || 0,
        prevMonthData.revenue || 0,
      );

      setStats({
        totalProducts: normalizedProducts.length,
        totalOrders: totalSold,
        totalRevenue: totalRevenueAmount,
        rating: Number(avgRating.toFixed(1)),
        totalReviews: totalSold,
        productGrowth: orderGrowthValue,
        orderGrowth: orderGrowthValue,
        revenueGrowth: revenueGrowthValue,
      });

      const performanceData = normalizedProducts
        .slice()
        .sort((a, b) => Number(b.sold) - Number(a.sold))
        .slice(0, 8)
        .map((item) => ({
          id: item.id,
          product: item.name,
          sold: item.sold,
          revenue: item.revenue,
          stock: item.stock,
        }));
      setPerformanceRows(performanceData);
      setProductStats(normalizedProducts);

      const topProductsData = normalizedProducts
        .slice()
        .sort((a, b) => Number(b.sold) - Number(a.sold))
        .slice(0, 5)
        .map((item) => ({
          name: item.name,
          sales: item.sold,
          revenue: item.revenue,
          stock: item.stock,
        }));
      setTopProducts(topProductsData);
      setMonthlyRevenue(monthlyData);
      setWeeklyRevenue(weeklyData);
    } catch (error) {
      console.error('Không thể tải dữ liệu artisan dashboard:', error);
      toast.error(error?.response?.data?.message || 'Không thể tải dữ liệu artisan dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo) {
      loadDashboardData();
    }
  }, [userInfo]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menuItems={menuItems}
      />

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 font-alata">
                {menuItems.find((item) => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-gray-600 font-nunito">Chào mừng trở lại, Người bán!</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Về trang chủ
              </button>
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
                  alt={userInfo?.displayName || userInfo?.username || 'Seller'}
                  className="w-10 h-10 rounded-full border-2 border-primary"
                />
                <div className="text-right">
                  <p className="font-semibold text-sm">{userInfo?.displayName || userInfo?.username || 'Người bán'}</p>
                  <p className="text-xs text-gray-500">Artisan</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'overview' && (
            loading ? (
              <div className="flex justify-center items-center py-16 gap-3 text-gray-600">
                <FaSpinner className="text-2xl animate-spin text-primary" />
                <span>Đang tải dữ liệu...</span>
              </div>
            ) : (
              <OverviewSection
                stats={stats}
                performanceRows={performanceRows}
                topProducts={topProducts}
                allProducts={productStats}
                monthlyRevenue={monthlyRevenue}
                formatCurrency={formatCurrency}
              />
            )
          )}

          {activeTab === 'products' && <ProductManagement />}

          {activeTab === 'orders' && <OrderManagement />}

          {activeTab === 'revenue' && (
            <RevenueManagement
              monthlyRevenue={monthlyRevenue}
              weeklyRevenue={weeklyRevenue}
            />
          )}

          {activeTab === 'settings' && <SettingsManagement />}
        </div>
      </main>
    </div>
  );
};

export default ArtisanDashboard;
