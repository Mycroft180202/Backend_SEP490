import React, { useMemo, useCallback } from 'react';
import {
  FaDollarSign,
  FaChartLine,
  FaShoppingCart,
  FaArrowUp,
  FaArrowDown,
  FaBoxOpen,
  FaSpinner,
} from 'react-icons/fa';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const STATUS_META = {
  WAITING_FOR_PICKUP: { label: 'Chờ xác nhận', badge: 'border border-yellow-100 bg-yellow-50 text-yellow-700' },
  SHIPPING: { label: 'Đã xác nhận', badge: 'border border-blue-100 bg-blue-50 text-blue-700' },
  PAID: { label: 'Đã thanh toán', badge: 'border border-indigo-100 bg-indigo-50 text-indigo-700' },
  COMPLETED: { label: 'Đã nhận hàng', badge: 'border border-green-100 bg-green-50 text-green-700' },
  CANCELLED: { label: 'Đã hủy', badge: 'border border-red-100 bg-red-50 text-red-700' },
  UNKNOWN: { label: 'Không rõ', badge: 'border border-gray-100 bg-gray-50 text-gray-700' },
};

const PAYMENT_META = {
  COD: { label: 'COD', badge: 'border border-gray-200 bg-gray-100 text-gray-600' },
  VNPAY: { label: 'VNPAY', badge: 'border border-indigo-100 bg-indigo-50 text-indigo-700' },
  TRANSFER: { label: 'Chuyển khoản', badge: 'border border-sky-100 bg-sky-50 text-sky-700' },
  UNKNOWN: { label: 'Không rõ', badge: 'border border-gray-100 bg-gray-50 text-gray-600' },
};

const normalizeStatusKey = (value) => {
  if (!value) return 'UNKNOWN';
  const upper = String(value).trim().toUpperCase();
  if (
    upper === 'WAITINGFORPICKUP'
    || upper === 'WAITING_FOR_PICKUP'
    || upper === 'PENDING'
    || upper === 'PROCESSING'
  ) {
    return 'WAITING_FOR_PICKUP';
  }
  if (
    upper === 'SHIPPING'
    || upper === 'SHIPPED'
    || upper === 'DELIVERING'
    || upper === 'DELIVERED'
  ) {
    return 'SHIPPING';
  }
  if (upper === 'PAID') {
    return 'PAID';
  }
  if (upper === 'CANCELLED' || upper === 'CANCELED') {
    return 'CANCELLED';
  }
  if (upper === 'COMPLETED' || upper === 'DONE') {
    return 'COMPLETED';
  }
  return STATUS_META[upper] ? upper : 'UNKNOWN';
};

const normalizePaymentKey = (value) => {
  if (!value) return 'UNKNOWN';
  const upper = String(value).trim().toUpperCase();
  if (upper.includes('COD')) return 'COD';
  if (upper.includes('VNPAY')) return 'VNPAY';
  if (upper.includes('TRANSFER')) return 'TRANSFER';
  return PAYMENT_META[upper] ? upper : 'UNKNOWN';
};

const getStatusMeta = (status) => STATUS_META[normalizeStatusKey(status)] || STATUS_META.UNKNOWN;
const getPaymentMeta = (method) => PAYMENT_META[normalizePaymentKey(method)] || PAYMENT_META.UNKNOWN;

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

const resolveTopProductImage = (item) => {
  const product = item?.product ?? {};
  const resolved =
    pickFirstNonEmpty([
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
    ]) || '';
  return toAbsoluteUrl(resolved);
};

const OverviewSection = ({
  summary = {},
  stockAlerts = { low: [], out: [] },
  monthlyRevenue = [],
  selectedYear,
  onYearChange,
  onMonthChange,
  selectedMonth = new Date().getMonth() + 1,
  distributionYear,
  onDistributionYearChange,
  distributionMonth = new Date().getMonth() + 1,
  onDistributionMonthChange,
  topProducts = [],
  topProductsRevenue = [],
  topProductsSold = [],
  topProductMode = 'revenue',
  onTopProductModeChange,
  topProductLoading = false,
  revenuePercentage = [],
  revenuePercentageLoading = false,
  latestOrders = [],
  formatCurrency,
  onNavigateToProducts,
}) => {
  const monthNames = useMemo(
    () => [
      'Tháng 1',
      'Tháng 2',
      'Tháng 3',
      'Tháng 4',
      'Tháng 5',
      'Tháng 6',
      'Tháng 7',
      'Tháng 8',
      'Tháng 9',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12',
    ],
    [],
  );

  const monthOptions = useMemo(
    () => monthNames.map((label, index) => ({ value: index + 1, label })),
    [monthNames],
  );

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const safeMonthly = useMemo(
    () => (Array.isArray(monthlyRevenue) ? monthlyRevenue : []),
    [monthlyRevenue],
  );

  const chartData = useMemo(() => {
    const byMonth = new Map(
      safeMonthly.map((item) => [
        Number(
          item?.month ??
            item?.Month ??
            item?.monthNumber ??
            item?.monthNo ??
            0,
        ),
        item,
      ]),
    );

    return monthNames.map((label, index) => {
      const month = index + 1;
      const entry = byMonth.get(month) || {};
      return {
        label,
        revenue: Number(
          entry?.revenue ??
            entry?.totalRevenue ??
            entry?.totalAmount ??
            entry?.totalAmmount ??
            0,
        ),
        orders: Number(
          entry?.totalOrderNumber ??
            entry?.totalOrderAmount ??
            entry?.totalOrders ??
            entry?.orders ??
            entry?.orderCount ??
            0,
        ),
      };
    });
  }, [monthNames, safeMonthly]);

  const normalizedSelectedMonth = useMemo(() => {
    const parsed = Number(selectedMonth);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 12) {
      return currentMonth;
    }
    return parsed;
  }, [selectedMonth, currentMonth]);

  const normalizedDistributionMonth = useMemo(() => {
    const source = distributionMonth ?? selectedMonth;
    const parsed = Number(source);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 12) {
      return currentMonth;
    }
    return parsed;
  }, [distributionMonth, selectedMonth, currentMonth]);

  const resolveCount = (value, fallback) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric;
    }
    if (Array.isArray(fallback)) {
      return fallback.length;
    }
    return 0;
  };

  const growth = Number(summary.monthGrowthPercent ?? 0);
  const growthState = growth > 0 ? 'up' : growth < 0 ? 'down' : 'flat';
  const growthColor =
    growthState === 'up'
      ? 'text-green-600'
      : growthState === 'down'
        ? 'text-red-600'
        : 'text-gray-500';
  const GrowthIcon =
    growthState === 'up'
      ? FaArrowUp
      : growthState === 'down'
        ? FaArrowDown
        : null;

  const formatVND = useCallback(
    (value) => {
      if (typeof formatCurrency === 'function') {
        const formatted = formatCurrency(value);
        if (typeof formatted === 'string' && formatted.trim()) {
          return formatted;
        }
      }
      const numeric = Number(value) || 0;
      return `${new Intl.NumberFormat('vi-VN').format(numeric)} VND`;
    },
    [formatCurrency],
  );

  const formatNumber = useCallback(
    (value) => (Number(value) || 0).toLocaleString('vi-VN'),
    [],
  );

  const formatDate = useCallback((value) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  const lowCount = resolveCount(stockAlerts.lowCount, stockAlerts.low);
  const outCount = resolveCount(stockAlerts.outCount, stockAlerts.out);
  const stockTotal = lowCount + outCount;

  const selectedMonthLabel =
    monthNames[normalizedSelectedMonth - 1] ||
    `Tháng ${normalizedSelectedMonth}`;
  const distributionMonthLabel =
    monthNames[normalizedDistributionMonth - 1] ||
    `Tháng ${normalizedDistributionMonth}`;

  const topMetricOptions = useMemo(
    () => [
      { key: 'revenue', label: 'Doanh thu' },
      { key: 'totalSold', label: 'Số lượng' },
    ],
    [],
  );

  const combinedTopProducts = useMemo(
    () => (Array.isArray(topProducts) ? topProducts : []),
    [topProducts],
  );
  const revenueTopProducts = useMemo(
    () => (Array.isArray(topProductsRevenue) ? topProductsRevenue : []),
    [topProductsRevenue],
  );
  const soldTopProducts = useMemo(
    () => (Array.isArray(topProductsSold) ? topProductsSold : []),
    [topProductsSold],
  );

  const displayedTopProducts = useMemo(() => {
    const primary =
      topProductMode === 'totalSold' ? soldTopProducts : revenueTopProducts;
    if (primary.length > 0) {
      return primary.slice(0, 5);
    }
    if (combinedTopProducts.length > 0) {
      return combinedTopProducts
        .slice()
        .sort((a, b) => {
          const aValue = Number(
            topProductMode === 'totalSold'
              ? a?.totalSold ?? 0
              : a?.revenue ?? 0,
          );
          const bValue = Number(
            topProductMode === 'totalSold'
              ? b?.totalSold ?? 0
              : b?.revenue ?? 0,
          );
          return bValue - aValue;
        })
        .slice(0, 5);
    }
    return [];
  }, [topProductMode, revenueTopProducts, soldTopProducts, combinedTopProducts]);

  const topProductRevenueChartData = useMemo(() => {
    const source =
      revenueTopProducts.length > 0 ? revenueTopProducts : combinedTopProducts;
    return source.slice(0, 5).map((item, index) => {
      const rawName = item?.name ?? `Sản phẩm ${index + 1}`;
      const shortName =
        rawName.length > 22 ? `${rawName.slice(0, 19)}...` : rawName;
      return {
        id: item?.id ?? `revenue-${index}`,
        name: rawName,
        shortName,
        revenue: Number(
          item?.revenue ??
            item?.totalAmmount ??
            item?.totalAmount ??
            item?.totalRevenue ??
            0,
        ),
        totalSold: Number(item?.totalSold ?? item?.quantity ?? item?.sold ?? 0),
        image: resolveTopProductImage(item),
      };
    });
  }, [revenueTopProducts, combinedTopProducts]);

  const topProductSoldChartData = useMemo(() => {
    const source =
      soldTopProducts.length > 0 ? soldTopProducts : combinedTopProducts;
    return source.slice(0, 5).map((item, index) => {
      const rawName = item?.name ?? `Sản phẩm ${index + 1}`;
      const shortName =
        rawName.length > 22 ? `${rawName.slice(0, 19)}...` : rawName;
      return {
        id: item?.id ?? `sold-${index}`,
        name: rawName,
        shortName,
        totalSold: Number(item?.totalSold ?? item?.quantity ?? item?.sold ?? 0),
        revenue: Number(
          item?.revenue ??
            item?.totalAmmount ??
            item?.totalAmount ??
            item?.totalRevenue ??
            0,
        ),
        image: resolveTopProductImage(item),
      };
    });
  }, [soldTopProducts, combinedTopProducts]);

  const hasTopProductItems = displayedTopProducts.length > 0;

  const topProductChartConfig = useMemo(() => {
    if (topProductMode === 'totalSold') {
      return {
        data: topProductSoldChartData,
        dataKey: 'totalSold',
        color: '#10b981',
        label: 'Sản phẩm bán chạy',
        formatter: (value) => [`${formatNumber(value)} lượt`, 'Lượt bán'],
        yTickFormatter: (value) => formatNumber(value),
        allowDecimals: false,
      };
    }
    return {
      data: topProductRevenueChartData,
      dataKey: 'revenue',
      color: '#f97316',
      label: 'Doanh thu theo sản phẩm',
      formatter: (value) => [formatVND(value), 'Doanh thu'],
      yTickFormatter: (value) =>
        `${(Number(value) / 1_000_000).toFixed(1)} tr`,
      allowDecimals: true,
    };
  }, [
    topProductMode,
    topProductSoldChartData,
    topProductRevenueChartData,
    formatNumber,
    formatVND,
  ]);

  const hasTopProductChartData = topProductChartConfig.data.some(
    (item) => Number(item?.[topProductChartConfig.dataKey] ?? 0) > 0,
  );

  const revenuePercentageData = useMemo(
    () =>
      (Array.isArray(revenuePercentage) ? revenuePercentage : [])
        .map((item, index) => {
          const rawPercent = Number(
            item?.percentage ?? item?.percent ?? item?.value ?? 0,
          );
          const percentValue = rawPercent <= 1 ? rawPercent * 100 : rawPercent;
          return {
            id: item?.id ?? item?.categoryId ?? `category-${index}`,
            name: item?.categoryName ?? item?.name ?? `Danh mục ${index + 1}`,
            value: percentValue,
            totalRevenue: Number(
              item?.totalRevenue ?? item?.revenue ?? item?.totalAmount ?? 0,
            ),
          };
        })
        .filter((item) => item.value > 0),
    [revenuePercentage],
  );

  const hasRevenuePercentageData = revenuePercentageData.length > 0;

  const pieColors = useMemo(
    () => [
      '#ef4444',
      '#f97316',
      '#facc15',
      '#22c55e',
      '#3b82f6',
      '#6366f1',
      '#a855f7',
      '#ec4899',
      '#14b8a6',
      '#64748b',
    ],
    [],
  );

  const formatPercent = useCallback(
    (value) => `${(Number(value) || 0).toFixed(1)}%`,
    [],
  );

  const activeYear = selectedYear || currentYear;
  const activeDistributionYear = distributionYear || selectedYear || currentYear;

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear - index),
    [currentYear],
  );

  const hasChartData = chartData.some(
    (item) => item.revenue > 0 || item.orders > 0,
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Doanh thu hôm nay (tạm tính)</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                {formatVND(summary.todayRevenue)}
              </h3>
            </div>
            <div className="rounded-full bg-green-100 p-4 text-green-600">
              <FaDollarSign className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {normalizedSelectedMonth === currentMonth
                  ? 'Doanh thu tháng này'
                  : `Doanh thu ${selectedMonthLabel}`}
              </p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                {formatVND(summary.monthRevenue)}
              </h3>
            </div>
            <div className="rounded-full bg-red-100 p-4 text-red-600">
              <FaChartLine className="text-2xl" />
            </div>
          </div>
          <div
            className={`mt-4 flex items-center gap-2 text-sm font-semibold ${growthColor}`}
          >
            {GrowthIcon ? <GrowthIcon /> : null}
            <span>{Math.abs(growth).toFixed(1)}%</span>
            <span className="text-xs font-medium text-gray-500">
              so với tháng trước
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đơn hàng hôm nay</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                {formatNumber(summary.todayOrders)}
              </h3>
            </div>
            <div className="rounded-full bg-blue-100 p-4 text-blue-600">
              <FaShoppingCart className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cảnh báo tồn kho</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                {formatNumber(stockTotal)}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {formatNumber(lowCount)} sắp hết • {formatNumber(outCount)} đã
                hết
              </p>
            </div>
            <div className="rounded-full bg-yellow-100 p-4 text-yellow-600">
              <FaBoxOpen className="text-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Hiệu suất doanh thu &amp; đơn hàng
                </h2>
                <span className="text-xs text-gray-500">
                  Theo dõi 12 tháng trong năm
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={activeYear}
                  onChange={(event) =>
                    onYearChange?.(Number(event.target.value))
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 h-72">
              {hasChartData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        `${(Number(value) / 1_000_000).toFixed(1)} tr`
                      }
                      width={80}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                      width={50}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'Doanh thu') {
                          return [formatVND(value), name];
                        }
                        return [`${formatNumber(value)} đơn`, name];
                      }}
                      labelFormatter={(label) => label}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Doanh thu"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      name="Đơn hàng"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  Không có dữ liệu doanh thu hoặc đơn hàng cho năm đã chọn.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-gray-800">
                  Tỷ trọng doanh thu theo danh mục
                </h2>
                <p className="text-xs text-gray-500">
                  Dữ liệu {distributionMonthLabel} • Năm {activeDistributionYear}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <select
                  value={normalizedDistributionMonth}
                  onChange={(event) =>
                    onDistributionMonthChange?.(Number(event.target.value))
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={activeDistributionYear}
                  onChange={(event) =>
                    onDistributionYearChange?.(Number(event.target.value))
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 h-72">
              {revenuePercentageLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
                  <FaSpinner className="animate-spin text-primary" />
                  <span>Đang tải dữ liệu tỷ trọng...</span>
                </div>
              ) : !hasRevenuePercentageData ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  Chưa có dữ liệu tỷ trọng doanh thu.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 30, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={revenuePercentageData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      label={({ name, value }) =>
                        `${name}: ${formatPercent(value)}`
                      }
                      labelLine={false}
                    >
                      {revenuePercentageData.map((entry, index) => (
                        <Cell
                          key={entry.id || `revenue-share-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, { payload }) => [
                        `${formatPercent(value)} • ${formatVND(
                          payload?.totalRevenue ?? 0,
                        )}`,
                        name,
                      ]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-gray-800">
                Top sản phẩm theo tháng
              </h2>
              <p className="text-xs text-gray-500">
                Dữ liệu {selectedMonthLabel} • Năm {activeYear}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {topMetricOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onTopProductModeChange?.(option.key)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      topProductMode === option.key
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <select
                  value={normalizedSelectedMonth}
                  onChange={(event) =>
                    onMonthChange?.(Number(event.target.value))
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={activeYear}
                  onChange={(event) =>
                    onYearChange?.(Number(event.target.value))
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-4">
            {topProductLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaSpinner className="animate-spin text-primary" />
                <span>Đang tải dữ liệu sản phẩm...</span>
              </div>
            ) : !hasTopProductItems ? (
              <p className="text-sm text-gray-500">
                Chưa có dữ liệu sản phẩm cho lựa chọn này.
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {displayedTopProducts.map((item, index) => {
                    const productImage =
                      resolveTopProductImage(item) || '/images/default-product.png';
                    return (
                      <div
                        key={item?.id || `top-product-${index}`}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 transition hover:bg-gray-50"
                      >
                        <span className="text-lg font-semibold text-primary">
                          {index + 1}
                        </span>
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={item?.name}
                            className="h-14 w-14 rounded-md object-cover"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = '/images/default-product.png';
                            }}
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-100 text-[10px] font-medium text-gray-500">
                            Không ảnh
                          </div>
                        )}
                        <div className="flex-1">
                          <p
                            className="text-sm font-semibold text-gray-800 line-clamp-1"
                            title={item?.name}
                          >
                            {item?.name}
                          </p>
                          <p className="text-xs font-semibold text-primary">
                            {topProductMode === 'revenue'
                              ? `Doanh thu: ${formatVND(item?.revenue)}`
                              : `Lượt bán: ${formatNumber(item?.totalSold)}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            {topProductMode === 'revenue'
                              ? `Lượt bán: ${formatNumber(item?.totalSold)}`
                              : `Doanh thu: ${formatVND(item?.revenue)}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">
                      {topProductChartConfig.label}
                    </h3>
                    <span className="text-xs text-gray-400">
                      {topProductMode === 'revenue'
                        ? 'Đơn vị: triệu VND'
                        : 'Đơn vị: lượt bán'}
                    </span>
                  </div>
                  <div className="mt-3 h-56">
                    {hasTopProductChartData ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topProductChartConfig.data}
                          margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="shortName"
                            tick={{ fontSize: 11 }}
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            allowDecimals={topProductChartConfig.allowDecimals}
                            tick={{ fontSize: 12 }}
                            width={70}
                            tickFormatter={topProductChartConfig.yTickFormatter}
                          />
                          <Tooltip
                            formatter={topProductChartConfig.formatter}
                            labelFormatter={(label, payload) =>
                              payload?.[0]?.payload?.name || label
                            }
                          />
                          <Bar
                            dataKey={topProductChartConfig.dataKey}
                            fill={topProductChartConfig.color}
                            maxBarSize={36}
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-500">
                        {topProductMode === 'revenue'
                          ? 'Chưa có dữ liệu doanh thu.'
                          : 'Chưa có dữ liệu số lượng.'}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Tình trạng tồn kho
              </h2>
              <p className="text-xs text-gray-500">
                Số lượng sản phẩm theo cảnh báo
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {formatNumber(stockTotal)} mục
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 rounded-lg border border-yellow-100 bg-yellow-50 px-4 py-4">
              <span className="text-xs font-semibold uppercase text-yellow-700">
                Sản phẩm sắp hết hàng
              </span>
              <span className="text-3xl font-bold text-gray-800">
                {formatNumber(lowCount)}
              </span>
              <span className="text-xs text-gray-500">
                Cần nhập thêm để tránh đứt hàng.
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-red-100 bg-red-50 px-4 py-4">
              <span className="text-xs font-semibold uppercase text-red-700">
                Sản phẩm đã hết hàng
              </span>
              <span className="text-3xl font-bold text-gray-800">
                {formatNumber(outCount)}
              </span>
              <span className="text-xs text-gray-500">
                Nên khôi phục tồn kho sớm.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToProducts?.()}
            className="mt-6 inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
          >
            Quản lý
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Đơn hàng gần đây
            </h2>
            <p className="text-xs text-gray-500">
              10 đơn mới nhất trong hệ thống
            </p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Mã đơn</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Khách hàng
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Tổng tiền
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Thanh toán
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Trạng thái
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Ngày tạo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.isArray(latestOrders) && latestOrders.length > 0 ? (
                latestOrders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-primary">
                      {order.id}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {order.customerName || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {formatVND(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {(() => {
                        const paymentMeta = getPaymentMeta(order.paymentMethod ?? order.paymentType);
                        return (
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${paymentMeta.badge}`}>
                            {paymentMeta.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {(() => {
                        const statusMeta = getStatusMeta(order.status ?? order.orderStatus);
                        return (
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${statusMeta.badge}`}>
                            {statusMeta.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
