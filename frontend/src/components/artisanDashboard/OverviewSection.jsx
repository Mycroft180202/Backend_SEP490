import React, { useMemo, useCallback } from 'react';
import {
  FaDollarSign,
  FaChartLine,
  FaShoppingCart,
  FaArrowUp,
  FaArrowDown,
  FaBoxOpen,
  FaExclamationTriangle,
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
} from 'recharts';

const OverviewSection = ({
  summary = {},
  stockAlerts = { low: [], out: [] },
  monthlyRevenue = [],
  selectedYear,
  onYearChange,
  selectedMonth = new Date().getMonth() + 1,
  onMonthChange,
  topProducts = [],
  topProductMode = 'revenue',
  topProductPeriod = 'month',
  onTopProductModeChange,
  onTopProductPeriodChange,
  topProductLoading = false,
  latestOrders = [],
  formatCurrency,
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

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const safeMonthly = useMemo(
    () => (Array.isArray(monthlyRevenue) ? monthlyRevenue : []),
    [monthlyRevenue],
  );

  const chartData = useMemo(() => {
    const byMonth = new Map(
      safeMonthly.map((item) => [Number(item.month), item]),
    );
    return monthNames.map((label, index) => {
      const month = index + 1;
      const entry = byMonth.get(month) || {};
      return {
        label,
        revenue: Number(entry.revenue || 0),
        orders: Number(
          entry.totalOrderAmount
          ?? entry.totalOrders
          ?? entry.orders
          ?? 0,
        ),
      };
    });
  }, [monthNames, safeMonthly]);

  const monthOptions = useMemo(
    () => monthNames.map((label, index) => ({ value: index + 1, label })),
    [monthNames],
  );

  const normalizedSelectedMonth = useMemo(() => {
    const parsed = Number(selectedMonth);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 12) {
      return currentMonth;
    }
    return parsed;
  }, [selectedMonth, currentMonth]);

  const growth = Number(summary.monthGrowthPercent ?? 0);
  const growthState = growth > 0 ? 'up' : growth < 0 ? 'down' : 'flat';
  const growthColor =
    growthState === 'up'
      ? 'text-green-600'
      : growthState === 'down'
        ? 'text-red-600'
        : 'text-gray-500';
  const GrowthIcon = growthState === 'up' ? FaArrowUp : growthState === 'down' ? FaArrowDown : null;

  const formatVND = useCallback(
    (value) => {
      if (typeof formatCurrency === 'function') {
        return formatCurrency(value);
      }
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(Number(value) || 0);
    },
    [formatCurrency],
  );

  const formatNumber = useCallback((value) => (Number(value) || 0).toLocaleString('vi-VN'), []);

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

  const lowStock = Array.isArray(stockAlerts.low) ? stockAlerts.low : [];
  const outStock = Array.isArray(stockAlerts.out) ? stockAlerts.out : [];
  const lowCount = Number(stockAlerts.lowCount ?? lowStock.length ?? 0);
  const outCount = Number(stockAlerts.outCount ?? outStock.length ?? 0);
  const stockTotal = lowCount + outCount;
  const isCurrentMonth = normalizedSelectedMonth === currentMonth;
  const selectedMonthLabel = monthOptions.find((option) => option.value === normalizedSelectedMonth)?.label
    || `Tháng ${normalizedSelectedMonth}`;

  const topPeriodOptions = useMemo(
    () => [
      { key: 'day', label: 'Ngày' },
      { key: 'month', label: 'Tháng' },
      { key: 'year', label: 'Năm' },
    ],
    [],
  );

  const topMetricOptions = useMemo(
    () => [
      { key: 'revenue', label: 'Doanh thu' },
      { key: 'totalSold', label: 'Số lượng' },
    ],
    [],
  );

  const activeYear = selectedYear || currentYear;
  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear - index),
    [currentYear],
  );

  const hasChartData = chartData.some((item) => item.revenue > 0 || item.orders > 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Doanh thu hôm nay</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">{formatVND(summary.todayRevenue)}</h3>
            </div>
            <div className="rounded-full bg-green-100 p-4 text-green-600">
              <FaDollarSign className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{isCurrentMonth ? 'Doanh thu tháng này' : `Doanh thu ${selectedMonthLabel}`}</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">{formatVND(summary.monthRevenue)}</h3>
            </div>
            <div className="rounded-full bg-red-100 p-4 text-red-600">
              <FaChartLine className="text-2xl" />
            </div>
          </div>
          <div className={`mt-4 flex items-center gap-2 text-sm font-semibold ${growthColor}`}>
            {GrowthIcon ? <GrowthIcon /> : null}
            <span>{Math.abs(growth).toFixed(1)}%</span>
            <span className="text-xs font-medium text-gray-500">so với tháng trước</span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đơn hàng hôm nay</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">{formatNumber(summary.todayOrders)}</h3>
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
              <h3 className="mt-2 text-3xl font-bold text-gray-800">{formatNumber(stockTotal)}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {formatNumber(lowCount)} sắp hết • {formatNumber(outCount)} đã hết
              </p>
            </div>
            <div className="rounded-full bg-yellow-100 p-4 text-yellow-600">
              <FaBoxOpen className="text-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Hiệu suất doanh thu &amp; đơn hàng</h2>
              <span className="text-xs text-gray-500">Theo dõi 12 tháng trong năm</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={activeYear}
                onChange={(event) => onYearChange?.(Number(event.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={normalizedSelectedMonth}
                onChange={(event) => onMonthChange?.(Number(event.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 h-72">
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${(Number(value) / 1_000_000).toFixed(1)} tr`}
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
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Sản phẩm sắp hết hàng</h2>
              <p className="text-xs text-gray-500">Tối đa 5 sản phẩm</p>
            </div>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
              {formatNumber(lowCount)} mục
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {lowStock.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">Tồn kho: {formatNumber(item.stock)}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700">
                  <FaExclamationTriangle /> Sắp hết
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="text-sm text-gray-500">
                {lowCount > 0
                  ? `Có ${formatNumber(lowCount)} sản phẩm sắp hết, dữ liệu chi tiết đang được cập nhật.`
                  : 'Không có sản phẩm nào sắp hết hàng.'}
              </p>
            )}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Sản phẩm đã hết hàng</h2>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              {formatNumber(outCount)} mục
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {outStock.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">Tồn kho: {formatNumber(item.stock)}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                  <FaExclamationTriangle /> Hết hàng
                </span>
              </div>
            ))}
            {outStock.length === 0 && (
              <p className="text-sm text-gray-500">
                {outCount > 0
                  ? `Có ${formatNumber(outCount)} sản phẩm hết hàng, dữ liệu chi tiết đang được cập nhật.`
                  : 'Không có sản phẩm nào đang hết hàng.'}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md xl:col-span-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Top 5 sản phẩm nổi bật</h2>
              <p className="text-xs text-gray-500">
                Theo {topProductMode === 'revenue' ? 'doanh thu' : 'số lượng bán ra'} • {topProductPeriod === 'day' ? 'Hôm nay' : topProductPeriod === 'month' ? selectedMonthLabel : `Năm ${activeYear}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {topPeriodOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onTopProductPeriodChange?.(option.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    topProductPeriod === option.key
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
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
              {topProductPeriod === 'month' && (
                <select
                  value={normalizedSelectedMonth}
                  onChange={(event) => onMonthChange?.(Number(event.target.value))}
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {topProductLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaSpinner className="animate-spin text-primary" />
                <span>Đang tải dữ liệu sản phẩm...</span>
              </div>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có dữ liệu sản phẩm cho lựa chọn này.</p>
            ) : (
              topProducts.slice(0, 5).map((item, index) => (
                <div key={item.id || `top-product-${index}`} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 transition hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-primary">{index + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">Đã bán: {formatNumber(item.totalSold)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">
                      {topProductMode === 'revenue' ? formatVND(item.revenue) : formatNumber(item.totalSold)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {topProductMode === 'revenue' ? 'Doanh thu' : 'Số lượng'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">10 đơn hàng mới nhất</h2>
            <p className="text-xs text-gray-500">Cập nhật theo thời gian thực</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 text-left">Mã đơn</th>
                <th className="px-4 py-3 text-left">Khách hàng</th>
                <th className="px-4 py-3 text-left">Giá trị</th>
                <th className="px-4 py-3 text-left">Thanh toán</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(latestOrders) && latestOrders.length > 0 ? (
                latestOrders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 text-sm hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-primary">{order.id}</td>
                    <td className="px-4 py-3 text-gray-800">{order.customerName || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatVND(order.totalAmount)}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                        {order.paymentMethod || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                        {order.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
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
