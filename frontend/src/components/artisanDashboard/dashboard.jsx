import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import {
  FaHome,
  FaProductHunt,
  FaClipboardList,
  FaCog,
  FaSpinner,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import OverviewSection from './OverviewSection';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import SettingsManagement from './SettingsManagement';
import { UserContext } from '../../context/UserContext';
import ArtisanDashboardService from '../../services/modules/artisan/artisanDashboardService';
import { UserService } from '../../services/modules/users/userService';

const pickFirstNonEmpty = (values = []) => {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      const nested = pickFirstNonEmpty(value);
      if (nested) {
        return nested;
      }
      continue;
    }
    if (typeof value === 'object') {
      const nested = pickFirstNonEmpty([
        value.url,
        value.href,
        value.image,
        value.imageUrl,
        value.imageURL,
        value.thumbnail,
        value.thumb,
        value.path,
        value.src,
        value.source,
        value.medium,
        value.small,
        value.large,
        value.original,
        value.value,
        value.preview,
        value.link,
        value.file,
        value.assetUrl,
        value.assetURL,
        value.publicUrl,
        value.publicURL,
        value.images,
        value.imageList,
      ]);
      if (nested) {
        return nested;
      }
      continue;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
};

const toAbsoluteUrl = (value) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    return '';
  }
  if (/^(?:https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }
  const base = (process.env.REACT_APP_CDN_BASE_URL || process.env.REACT_APP_STORAGE_BASE_URL || process.env.REACT_APP_API_BASE_URL || '').trim();
  if (!base) {
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
  const normalizedBase = base.replace(/\/$/, '');
  const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`;
  return `${normalizedBase}${normalizedPath}`;
};

const ArtisanDashboard = () => {
  const { userInfo } = useContext(UserContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const realtimeRefreshTimeoutRef = useRef(null);
  const overviewRefreshInFlightRef = useRef(false);
  const overviewRefreshPendingRef = useRef(false);
  const lastOverviewRefreshAtRef = useRef(0);
  const profileCacheRef = useRef(new Map());
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
  const [topProductsCombined, setTopProductsCombined] = useState([]);
  const [topProductsRevenue, setTopProductsRevenue] = useState([]);
  const [topProductsSold, setTopProductsSold] = useState([]);
  const [distributionYear, setDistributionYear] = useState(defaultYear);
  const [distributionMonth, setDistributionMonth] = useState(defaultMonth);
  const [revenuePercentage, setRevenuePercentage] = useState([]);
  const [revenuePercentageLoading, setRevenuePercentageLoading] = useState(false);
  const [topProductMode, setTopProductMode] = useState('revenue');
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

    const cache = profileCacheRef.current instanceof Map ? profileCacheRef.current : new Map();
    profileCacheRef.current = cache;

    const missingIds = uniqueCustomerIds.filter((id) => !cache.has(id));
    if (missingIds.length > 0) {
      const profileEntries = await Promise.all(
        missingIds.map(async (customerId) => {
          try {
            const profile = await UserService.getById(customerId);
            return [customerId, profile];
          } catch (error) {
            console.warn('Không thể lấy thông tin khách hàng:', customerId, error);
            return [customerId, null];
          }
        }),
      );
      profileEntries.forEach(([id, profile]) => {
        cache.set(id, profile);
      });
    }

    const profileMap = cache;

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

  const handleDistributionYearChange = useCallback((value) => {
    const numericYear = Number(value);
    setDistributionYear(Number.isNaN(numericYear) ? defaultYear : numericYear);
  }, [defaultYear]);

  const handleDistributionMonthChange = useCallback((value) => {
    const numericMonth = Number(value);
    if (Number.isNaN(numericMonth) || numericMonth < 1 || numericMonth > 12) {
      setDistributionMonth(defaultMonth);
    } else {
      setDistributionMonth(numericMonth);
    }
  }, [defaultMonth]);

  const handleTopProductModeChange = useCallback((mode) => {
    setTopProductMode(mode);
  }, []);

  const menuItems = [
    { id: 'overview', icon: FaHome, label: 'Tổng quan', path: '/artisan' },
    { id: 'products', icon: FaProductHunt, label: 'Sản phẩm', path: '/artisan/products' },
    { id: 'orders', icon: FaClipboardList, label: 'Đơn hàng', path: '/artisan/orders' },
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

      // Fetch sequentially to avoid spiking backend DB connections.
      const todaySummaryRes = await ArtisanDashboardService.getTodaySummary();
      const monthlyRes = await ArtisanDashboardService.getMonthlyRevenue(targetYear);
      const stockRes = await ArtisanDashboardService.getOutOfStockProducts();
      const latestOrdersRes = await ArtisanDashboardService.getLatestOrders();

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

        if (
          !low.length &&
          !out.length &&
          data &&
          typeof data === 'object' &&
          (data.product || data.Product || data.items || data.data || data.id || data.name)
        ) {
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
      const fallbackYear = now.getFullYear();
      const fallbackMonth = now.getMonth() + 1;
      const targetYear = selectedYear || fallbackYear;
      const numericMonth = Number(selectedMonth);
      const targetMonth = Number.isFinite(numericMonth) && numericMonth >= 1 && numericMonth <= 12
        ? numericMonth
        : fallbackMonth;

      // Fetch sequentially to avoid spiking backend DB connections.
      const revenueResponse = await ArtisanDashboardService.getTopProducts({
        metric: 'revenue',
        year: targetYear,
        month: targetMonth,
      });
      const soldResponse = await ArtisanDashboardService.getTopProducts({
        metric: 'totalSold',
        year: targetYear,
        month: targetMonth,
      });

      const normalizeTopProducts = (response) => {
        const list = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response)
            ? response
            : response?.data || [];
        return list.map((item, index) => {
          const product = item?.product ?? item?.Product ?? {};
          const resolvedImage = pickFirstNonEmpty([
            item?.image,
            item?.imageUrl,
            item?.imageURL,
            item?.thumbnail,
            item?.thumb,
            product?.image,
            product?.imageUrl,
            product?.imageURL,
            product?.thumbnail,
            product?.thumb,
            product?.primaryImage,
            item?.images,
            item?.imageList,
            item?.media,
            item?.imageResponses,
            item?.gallery,
            product?.images,
            product?.imageList,
            product?.media,
            product?.gallery,
            product?.productImages,
            product?.imageProductResponses,
            product?.imageResponses,
            product?.imageGallery,
            product?.variants,
            product?.options,
          ]);
          return {
            id: product?.id ?? item?.productId ?? item?.id ?? `top-${index}`,
            name: product?.name ?? item?.productName ?? item?.name ?? 'Sản phẩm',
            revenue: Number(
              item?.totalAmmount
              ?? item?.totalAmount
              ?? item?.revenue
              ?? item?.totalRevenue
              ?? 0,
            ),
            totalSold: Number(item?.totalSold ?? item?.quantity ?? item?.sold ?? item?.amount ?? 0),
            image: toAbsoluteUrl(resolvedImage),
            product: product,
          };
        });
      };

      const revenueList = normalizeTopProducts(revenueResponse)
        .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0));
      const soldList = normalizeTopProducts(soldResponse)
        .sort((a, b) => Number(b.totalSold || 0) - Number(a.totalSold || 0));

      setTopProductsRevenue(revenueList);
      setTopProductsSold(soldList);

      const mergeMap = new Map();
      const mergeIntoMap = (list) => {
        list.forEach((item) => {
          const existing = mergeMap.get(item.id);
          if (existing) {
            mergeMap.set(item.id, {
              ...existing,
              ...item,
              revenue: item.revenue !== undefined ? item.revenue : existing.revenue,
              totalSold: item.totalSold !== undefined ? item.totalSold : existing.totalSold,
              image: item.image || existing.image,
              name: item.name || existing.name,
            });
          } else {
            mergeMap.set(item.id, { ...item });
          }
        });
      };

      mergeIntoMap(revenueList);
      mergeIntoMap(soldList);

      setTopProductsCombined(Array.from(mergeMap.values()));
    } catch (error) {
      console.error('Không thể tải top sản phẩm:', error);
      setTopProductsRevenue([]);
      setTopProductsSold([]);
      setTopProductsCombined([]);
    } finally {
      setTopProductLoading(false);
    }
  }, [userInfo, selectedYear, selectedMonth]);

  const loadRevenueDistribution = useCallback(async () => {
    if (!userInfo?.userID && !userInfo?.userId) {
      return;
    }
    setRevenuePercentageLoading(true);
    try {
      const now = new Date();
      const fallbackYear = now.getFullYear();
      const fallbackMonth = now.getMonth() + 1;
      const targetYear = distributionYear || fallbackYear;
      const numericMonth = Number(distributionMonth);
      const targetMonth = Number.isFinite(numericMonth) && numericMonth >= 1 && numericMonth <= 12
        ? numericMonth
        : fallbackMonth;

      const response = await ArtisanDashboardService.getRevenuePercentage({
        year: targetYear,
        month: targetMonth,
      });

      const distributionSource = Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response)
          ? response
          : response?.data || [];

      const distributionList = distributionSource.map((item, index) => ({
        categoryId: item?.categoryId ?? item?.category?.id ?? `category-${index}`,
        categoryName: item?.categoryName ?? item?.category?.name ?? 'Danh mục',
        revenue: Number(
          item?.revenue
          ?? item?.totalRevenue
          ?? item?.totalAmount
          ?? item?.amount
          ?? 0,
        ),
        percentage: Number(item?.percentage ?? item?.percent ?? item?.value ?? 0),
      }));

      setRevenuePercentage(distributionList);
    } catch (error) {
      console.error('Không thể tải tỷ trọng doanh thu:', error);
      setRevenuePercentage([]);
    } finally {
      setRevenuePercentageLoading(false);
    }
  }, [userInfo, distributionYear, distributionMonth]);

  const refreshOverview = useCallback(async () => {
    if (activeTab !== 'overview') {
      return;
    }

    if (overviewRefreshInFlightRef.current) {
      overviewRefreshPendingRef.current = true;
      return;
    }

    const now = Date.now();
    // Hard throttle: avoid hammering backend when realtime events arrive frequently.
    if (now - lastOverviewRefreshAtRef.current < 5000) {
      overviewRefreshPendingRef.current = true;
      return;
    }

    overviewRefreshInFlightRef.current = true;
    lastOverviewRefreshAtRef.current = now;

    try {
      // Run sequentially to keep backend DB connections stable.
      await loadDashboardData();
      await loadTopProducts();
      await loadRevenueDistribution();
    } finally {
      overviewRefreshInFlightRef.current = false;
      if (overviewRefreshPendingRef.current) {
        overviewRefreshPendingRef.current = false;
        // Schedule a single follow-up refresh after a small delay.
        setTimeout(() => {
          refreshOverview();
        }, 800);
      }
    }
  }, [activeTab, loadDashboardData, loadRevenueDistribution, loadTopProducts]);

  useEffect(() => {
    refreshOverview();
  }, [refreshOverview]);

  const scheduleOverviewRefresh = useCallback(() => {
    if (activeTab !== 'overview') {
      return;
    }
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }
    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      refreshOverview();
    }, 800);
  }, [activeTab, refreshOverview]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handler = () => scheduleOverviewRefresh();
    window.addEventListener('realtime:orderUpdated', handler);
    window.addEventListener('realtime:paymentUpdated', handler);
    window.addEventListener('realtime:shipmentStatusUpdated', handler);

    return () => {
      window.removeEventListener('realtime:orderUpdated', handler);
      window.removeEventListener('realtime:paymentUpdated', handler);
      window.removeEventListener('realtime:shipmentStatusUpdated', handler);
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }
    };
  }, [scheduleOverviewRefresh]);

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
              <div className="flex items-center gap-2">
                <img
                  src={userInfo?.userUrlImage || '/images/default-avatar.png'}
                  alt={userInfo?.displayName || userInfo?.username || 'Seller'}
                  className="w-10 h-10 rounded-full border-2 border-primary"
                />
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {userInfo?.displayName || userInfo?.username || 'Artisan'}
                  </p>
                  <p className="text-xs text-gray-500">Bảng điều khiển nhà cung cấp</p>
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
                topProducts={topProductsCombined}
                topProductsRevenue={topProductsRevenue}
                topProductsSold={topProductsSold}
                topProductMode={topProductMode}
                onTopProductModeChange={handleTopProductModeChange}
                topProductLoading={topProductLoading}
                revenuePercentage={revenuePercentage}
                revenuePercentageLoading={revenuePercentageLoading}
                distributionYear={distributionYear}
                distributionMonth={distributionMonth}
                onDistributionYearChange={handleDistributionYearChange}
                onDistributionMonthChange={handleDistributionMonthChange}
                latestOrders={latestOrders}
                formatCurrency={formatCurrency}
                onNavigateToProducts={() => setActiveTab('products')}
                onNavigateToOrders={() => setActiveTab('orders')}
              />
            )
          )}

          {activeTab === 'products' && <ProductManagement />}

          {activeTab === 'orders' && <OrderManagement />}

          {activeTab === 'settings' && <SettingsManagement />}
        </div>
      </main>
    </div>
  );
};

export default ArtisanDashboard;
