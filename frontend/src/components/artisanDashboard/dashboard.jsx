import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  FaHome,
  FaProductHunt,
  FaClipboardList,
  FaChartLine,
  FaCog,
  FaSearch,
  FaSpinner,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import OverviewSection from './OverviewSection';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import RevenueManagement from './RevenueManagement';
import SettingsManagement from './SettingsManagement';
import { UserContext } from '../../context/UserContext';
import ArtisanDashboardService from '../../services/modules/artisan/artisanDashboardService';
import { UserService } from '../../services/modules/users/userService';

const ArtisanDashboard = () => {
  const { userInfo } = useContext(UserContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [summary, setSummary] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    monthGrowthPercent: 0,
    todayOrders: 0,
  });
  const [stockAlerts, setStockAlerts] = useState({ low: [], out: [], lowCount: 0, outCount: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topProductMode, setTopProductMode] = useState('revenue');
  const [topProductPeriod, setTopProductPeriod] = useState('month');
  const [topProductLoading, setTopProductLoading] = useState(false);
  const [latestOrders, setLatestOrders] = useState([]);

  const enrichOrdersWithProfiles = useCallback(async (orders) => {
    if (!Array.isArray(orders) || orders.length === 0) {
      return orders || [];
    }

    const uniqueCustomerIds = Array.from(
      new Set(
        orders
          .map((order) => order.customerId || order.customerID)
          .filter((id) => typeof id === 'string' && id.trim()),
      ),
    );

    if (uniqueCustomerIds.length === 0) {
      return orders;
    }

    const profileEntries = await Promise.all(
      uniqueCustomerIds.map(async (customerId) => {
        try {
          const profile = await UserService.getById(customerId);
          return [customerId, profile];
        } catch (error) {
          console.warn('Không thể lấy thông tin khách hàng:', customerId, error);
          return [customerId, null];
        }
      }),
    );

    const profileMap = new Map(profileEntries);

    return orders.map((order) => {
      const customerId = order.customerId || order.customerID;
      if (!customerId) {
        return order;
      }

      const profile = profileMap.get(customerId);
      if (!profile) {
        return order;
      }

      const resolvedName =
        profile.displayName
        || profile.fullName
        || profile.name
        || profile.userName
        || profile.username
        || null;

      if (!resolvedName) {
        return order;
      }

      if (order.customerName === resolvedName) {
        return order;
      }

      return {
        ...order,
        customerName: resolvedName,
      };
    });
  }, []);

  const handleYearChange = useCallback((value) => {
    const numericYear = Number(value);
    setSelectedYear(Number.isNaN(numericYear) ? defaultYear : numericYear);
  }, [defaultYear]);

  const handleMonthChange = useCallback((value) => {
    const numericMonth = Number(value);
    if (Number.isNaN(numericMonth) || numericMonth < 1 || numericMonth > 12) {
      setSelectedMonth(defaultMonth);
    } else {
      setSelectedMonth(numericMonth);
    }
  }, [defaultMonth]);

  const handleTopProductModeChange = useCallback((mode) => {
    setTopProductMode(mode);
  }, []);

  const handleTopProductPeriodChange = useCallback((period) => {
    setTopProductPeriod(period);
  }, []);

  const menuItems = [
    { id: 'overview', icon: FaHome, label: 'Tổng quan', path: '/artisan' },
    { id: 'products', icon: FaProductHunt, label: 'Sản phẩm', path: '/artisan/products' },
    { id: 'orders', icon: FaClipboardList, label: 'Đơn hàng', path: '/artisan/orders' },
    { id: 'revenue', icon: FaChartLine, label: 'Doanh thu', path: '/artisan/revenue' },
    { id: 'settings', icon: FaCog, label: 'Cài đặt', path: '/artisan/settings' },
  ];

  const formatCurrency = (amount, suffix = ' VND') => {
    const numeric = Number(amount) || 0;
    return `${new Intl.NumberFormat('vi-VN').format(numeric)}${suffix}`;
  };

  const loadDashboardData = useCallback(async () => {
    if (!userInfo?.userID && !userInfo?.userId) {
      return;
    }
    setLoading(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const targetYear = selectedYear || currentYear;
      const targetMonth = selectedMonth || currentMonth;

      const [todaySummaryRes, monthlyRes, weeklyRes, stockRes, latestOrdersRes] = await Promise.all([
        ArtisanDashboardService.getTodaySummary(),
        ArtisanDashboardService.getMonthlyRevenue(targetYear),
        ArtisanDashboardService.getWeeklyRevenue(targetYear, targetMonth),
        ArtisanDashboardService.getOutOfStockProducts(),
        ArtisanDashboardService.getLatestOrders(),
      ]);

      const normalizeMonthly = (source) => {
        const list = Array.isArray(source?.items)
          ? source.items
          : Array.isArray(source)
            ? source
            : source?.data || [];
        return list
          .map((item) => {
            const monthValue = Number(
              item?.month
              ?? item?.Month
              ?? item?.monthNumber
              ?? item?.monthNo
              ?? 0,
            );
            return {
              month: monthValue,
              revenue: Number(
                item?.revenue
                ?? item?.totalRevenue
                ?? item?.totalAmount
                ?? item?.totalAmmount
                ?? 0,
              ),
              totalOrderAmount: Number(
                item?.totalOrderAmount
                ?? item?.totalOrders
                ?? item?.orderCount
                ?? item?.totalOrderNumber
                ?? 0,
              ),
            };
          })
          .filter((entry) => entry.month >= 1 && entry.month <= 12);
      };

      const monthlyData = normalizeMonthly(monthlyRes);
      setMonthlyRevenue(monthlyData);

      const weeklyList = Array.isArray(weeklyRes?.items)
        ? weeklyRes.items
        : Array.isArray(weeklyRes)
          ? weeklyRes
          : weeklyRes?.data || [];
      const normalizedWeekly = weeklyList.map((item) => {
        const totalOrders = Number(item?.totalOrderNumber ?? item?.totalOrders ?? item?.orderCount ?? 0);
        return ({
        weekNumber: Number(item?.weekNumber ?? item?.week ?? 0),
        startDate: item?.startDate ?? item?.fromDate ?? item?.start ?? null,
        endDate: item?.endDate ?? item?.toDate ?? item?.end ?? null,
          revenue: Number(item?.revenue ?? item?.totalRevenue ?? item?.totalAmmount ?? 0),
          totalOrderNumber: totalOrders,
          totalOrderAmount: totalOrders,
        });
      });
      setWeeklyRevenue(normalizedWeekly);

      const currentMonthEntry =
        monthlyData.find((item) => item.month === targetMonth) || { revenue: 0, totalOrderAmount: 0 };
      const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
      const prevMonthEntry =
        monthlyData.find((item) => item.month === prevMonth) || { revenue: 0 };

      const calcGrowth = (currentValue, previousValue) => {
        if (!previousValue && !currentValue) return 0;
        if (!previousValue) return 100;
        const growthValue = ((currentValue - previousValue) / previousValue) * 100;
        return Number.isFinite(growthValue) ? Number(growthValue.toFixed(1)) : 0;
      };

      const todayRevenueValue = Number(
        todaySummaryRes?.revenue
        ?? todaySummaryRes?.totalRevenue
        ?? todaySummaryRes?.amount
        ?? todaySummaryRes
        ?? 0,
      );
      const todayOrdersValue = Number(
        todaySummaryRes?.orderNumber
        ?? todaySummaryRes?.totalOrders
        ?? todaySummaryRes?.orders
        ?? todaySummaryRes?.orderCount
        ?? todaySummaryRes?.totalOrderAmount
        ?? 0,
      );

      setSummary({
        todayRevenue: todayRevenueValue,
        monthRevenue: currentMonthEntry.revenue || 0,
        monthGrowthPercent: calcGrowth(currentMonthEntry.revenue || 0, prevMonthEntry.revenue || 0),
        todayOrders: todayOrdersValue,
      });

      const parseStockData = (data) => {
        const low = [];
        const out = [];
        const nearCount = Number(
          data?.nearlyOutOfStock
          ?? data?.nearOutOfStock
          ?? data?.lowStockCount
          ?? data?.nearlyOutOfStockCount
          ?? 0,
        );
        const outCountRaw = Number(
          data?.outOfStock
          ?? data?.outStock
          ?? data?.outStockCount
          ?? 0,
        );
        const pushEntry = (entry, index) => {
          if (!entry) return;
          const product = entry.product ?? entry.Product ?? entry;
          const stockValue = Number(
            product?.stock
            ?? product?.Stock
            ?? entry?.stock
            ?? entry?.Stock
            ?? entry?.quantity
            ?? entry?.Quantity
            ?? entry?.remaining
            ?? 0,
          );
          const normalized = {
            id: product?.id ?? product?.Id ?? entry?.id ?? entry?.Id ?? `stock-${index}`,
            name: product?.name ?? product?.Name ?? entry?.name ?? entry?.Name ?? 'Sản phẩm',
            stock: stockValue,
            image: product?.imageUrl ?? product?.imageURL ?? product?.ImageUrl ?? entry?.imageUrl ?? '',
          };
          if (stockValue <= 0) {
            out.push(normalized);
          } else {
            low.push(normalized);
          }
        };
        const consume = (list) => {
          if (!Array.isArray(list)) return;
          list.forEach((entry, index) => pushEntry(entry, index));
        };

        consume(data?.nearlyOutOfStock);
        consume(data?.lowStock);
        consume(data?.outOfStock);
        consume(data?.items);
        if (Array.isArray(data)) consume(data);
        if (data?.data) consume(data.data);

        if (!low.length && !out.length && data && typeof data === 'object') {
          pushEntry(data, 0);
        }

        const resolvedLowCount = Number.isFinite(nearCount) && nearCount > 0 ? nearCount : low.length;
        const resolvedOutCount = Number.isFinite(outCountRaw) && outCountRaw > 0 ? outCountRaw : out.length;
        return {
          low,
          out,
          lowCount: resolvedLowCount,
          outCount: resolvedOutCount,
        };
      };

      setStockAlerts(parseStockData(stockRes));

      const normalizeOrders = (source) => {
        const list = Array.isArray(source?.items)
          ? source.items
          : Array.isArray(source)
            ? source
            : source?.data || [];
        return list.slice(0, 10).map((order, index) => {
          const nestedCustomer =
            order?.customer
            ?? order?.buyer
            ?? order?.user
            ?? null;

          const nestedCustomerName = typeof nestedCustomer === 'string'
            ? nestedCustomer
            : nestedCustomer?.displayName
              ?? nestedCustomer?.fullName
              ?? nestedCustomer?.name
              ?? nestedCustomer?.username
              ?? null;

          return {
            id: order?.orderNumber ?? order?.id ?? order?.orderId ?? `order-${index}`,
            customerId:
              order?.customerId
              ?? nestedCustomer?.id
              ?? nestedCustomer?.userId
              ?? nestedCustomer?.userID
              ?? order?.userId
              ?? order?.userID
              ?? null,
            customerName:
              order?.customerDisplayName
              ?? order?.buyerDisplayName
              ?? order?.userDisplayName
              ?? order?.customerName
              ?? order?.buyerName
              ?? order?.userName
              ?? nestedCustomerName
              ?? order?.customerId
              ?? 'Khách hàng',
            totalAmount: Number(order?.totalAmount ?? order?.amount ?? order?.total ?? 0),
            status: order?.status ?? order?.orderStatus ?? order?.statusName ?? 'Không rõ',
            paymentMethod: order?.paymentMethod ?? order?.paymentType ?? order?.paymentStatus ?? '',
            createdAt:
              order?.createdAt
              ?? order?.createAt
              ?? order?.orderDate
              ?? order?.createdDate
              ?? order?.date
              ?? null,
          };
        });
      };

      const normalizedOrders = normalizeOrders(latestOrdersRes);
      const enrichedOrders = await enrichOrdersWithProfiles(normalizedOrders)
        .catch(() => normalizedOrders);
      setLatestOrders(enrichedOrders);
    } catch (error) {
      console.error('Không thể tải dữ liệu artisan dashboard:', error);
      toast.error(error?.response?.data?.message || 'Không thể tải dữ liệu artisan dashboard');
    } finally {
      setLoading(false);
    }
  }, [userInfo, selectedYear, selectedMonth, enrichOrdersWithProfiles]);

  const loadTopProducts = useCallback(async () => {
    if (!userInfo?.userID && !userInfo?.userId) {
      return;
    }
    setTopProductLoading(true);
    try {
      const now = new Date();
      const metric = topProductMode;
      const fallbackYear = now.getFullYear();
      const fallbackMonth = now.getMonth() + 1;
      const targetYear = selectedYear || fallbackYear;
      const targetMonth = (selectedMonth && Number(selectedMonth) >= 1 && Number(selectedMonth) <= 12)
        ? Number(selectedMonth)
        : fallbackMonth;

      const response = await ArtisanDashboardService.getTopProducts({
        metric,
        period: topProductPeriod,
        year: targetYear,
        month: topProductPeriod === 'month' ? targetMonth : undefined,
      });

      const list = Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response)
          ? response
          : response?.data || [];
      const normalized = list.slice(0, 5).map((item, index) => {
        const product = item?.product ?? item?.Product ?? {};
        return {
          id: product?.id ?? item?.productId ?? item?.id ?? `top-${index}`,
          name: product?.name ?? item?.productName ?? item?.name ?? 'Sản phẩm',
          totalSold: Number(item?.totalSold ?? item?.quantity ?? item?.sold ?? 0),
          revenue: Number(
            item?.totalAmmount
            ?? item?.totalAmount
            ?? item?.revenue
            ?? item?.totalRevenue
            ?? 0,
          ),
          image: product?.imageUrl ?? product?.imageURL ?? item?.imageUrl ?? item?.image ?? '',
        };
      });
      setTopProducts(normalized);
    } catch (error) {
      console.error('Không thể tải top sản phẩm:', error);
      setTopProducts([]);
    } finally {
      setTopProductLoading(false);
    }
  }, [userInfo, topProductMode, topProductPeriod, selectedYear, selectedMonth]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    loadTopProducts();
  }, [loadTopProducts]);

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
                summary={summary}
                stockAlerts={stockAlerts}
                monthlyRevenue={monthlyRevenue}
                selectedYear={selectedYear}
                onYearChange={handleYearChange}
                selectedMonth={selectedMonth}
                onMonthChange={handleMonthChange}
                topProducts={topProducts}
                topProductMode={topProductMode}
                topProductPeriod={topProductPeriod}
                onTopProductModeChange={handleTopProductModeChange}
                onTopProductPeriodChange={handleTopProductPeriodChange}
                topProductLoading={topProductLoading}
                latestOrders={latestOrders}
                formatCurrency={formatCurrency}
                onNavigateToProducts={() => setActiveTab('products')}
              />
            )
          )}

          {activeTab === 'products' && <ProductManagement />}

          {activeTab === 'orders' && <OrderManagement />}

          {activeTab === 'revenue' && (
            <RevenueManagement
              monthlyRevenue={monthlyRevenue}
              weeklyRevenue={weeklyRevenue}
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
              selectedMonth={selectedMonth}
              onMonthChange={handleMonthChange}
            />
          )}

          {activeTab === 'settings' && <SettingsManagement />}
        </div>
      </main>
    </div>
  );
};

export default ArtisanDashboard;
