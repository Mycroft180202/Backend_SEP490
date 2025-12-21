import React, { useMemo } from 'react';
import {
  FaFileExport,
  FaChartLine,
  FaDollarSign,
  FaWallet,
  FaCalendarAlt,
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

const formatCurrency = (amount) => {
  const numeric = Number(amount) || 0;
  return `${new Intl.NumberFormat('vi-VN').format(numeric)} VND`;
};

const formatMonthLabelValue = (month) => {
  if (!month) return '--';
  return `Tháng ${month}`;
};

const formatDateValue = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

const formatNumberValue = (value) => (Number(value) || 0).toLocaleString('vi-VN');

const resolveOrderCount = (item = {}) => {
  const candidates = [
    item.totalOrderNumber,
    item.totalOrders,
    item.orderCount,
    item.totalOrdersCount,
    item.totalQuantity,
    item.totalOrderAmount,
  ];
  const found = candidates.find((candidate) => Number.isFinite(Number(candidate)) && Number(candidate) >= 0);
  return Number(found || 0);
};

const RevenueManagement = ({
  monthlyRevenue = [],
  weeklyRevenue = [],
  selectedYear,
  onYearChange,
  selectedMonth = new Date().getMonth() + 1,
  onMonthChange,
}) => {
  const safeMonthly = Array.isArray(monthlyRevenue) ? monthlyRevenue : [];
  const safeWeekly = Array.isArray(weeklyRevenue) ? weeklyRevenue : [];

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear - index),
    [currentYear],
  );

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

  const normalizedSelectedMonth = useMemo(() => {
    const parsed = Number(selectedMonth);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 12) {
      return new Date().getMonth() + 1;
    }
    return parsed;
  }, [selectedMonth]);

  const selectedMonthLabel = monthOptions.find((option) => option.value === normalizedSelectedMonth)?.label
    || `Tháng ${normalizedSelectedMonth}`;

  const monthlyChartData = useMemo(() => (
    safeMonthly
      .slice()
      .sort((a, b) => Number(a.month || 0) - Number(b.month || 0))
      .map((item) => ({
        label: formatMonthLabelValue(item.month),
        revenue: Number(item.revenue || item.totalRevenue || 0),
        orders: resolveOrderCount(item),
      }))
  ), [safeMonthly]);

  const weeklyChartData = useMemo(() => (
    safeWeekly
      .slice()
      .sort((a, b) => Number(a.weekNumber || 0) - Number(b.weekNumber || 0))
      .map((item) => ({
        label: item.weekNumber ? `Tuần ${item.weekNumber}` : 'Tuần',
        revenue: Number(item.revenue || item.totalRevenue || 0),
        orders: resolveOrderCount(item),
        startDate: item.startDate || item.fromDate || null,
        endDate: item.endDate || item.toDate || null,
      }))
  ), [safeWeekly]);

  const totalRevenue = safeMonthly.reduce(
    (sum, item) => sum + Number(item.revenue || item.totalRevenue || 0),
    0,
  );
  const totalOrderCount = safeMonthly.reduce(
    (sum, item) => sum + resolveOrderCount(item),
    0,
  );

  const bestMonth = safeMonthly.reduce((best, current) => {
    if (!best || Number(current.revenue || 0) > Number(best.revenue || 0)) {
      return current;
    }
    return best;
  }, null);

  const bestWeek = safeWeekly.reduce((best, current) => {
    if (!best || Number(current.revenue || 0) > Number(best.revenue || 0)) {
      return current;
    }
    return best;
  }, null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Tổng doanh thu</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(totalRevenue)}</h3>
              <p className="text-xs text-gray-500 mt-1">Từ đầu năm</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <FaDollarSign className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Tổng số đơn hàng</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{`${formatNumberValue(totalOrderCount)} đơn`}</h3>
              <p className="text-xs text-gray-500 mt-1">Tổng số đơn đã bán</p>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <FaWallet className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Tháng cao nhất</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">
                {formatMonthLabelValue(bestMonth?.month)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(bestMonth?.revenue || 0)}</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-full">
              <FaCalendarAlt className="text-orange-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-nunito">Tuần cao nhất</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">
                {bestWeek ? `Tuần ${bestWeek.weekNumber}` : '--'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(bestWeek?.revenue || 0)}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <FaChartLine className="text-purple-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Doanh thu theo tháng</h2>
            <p className="text-sm text-gray-600 mt-1">
              Hiển thị 12 tháng trong năm {selectedYear || currentYear}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedYear || currentYear}
              onChange={(event) => onYearChange?.(Number(event.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaFileExport /> Xuất báo cáo
            </button>
          </div>
        </div>
        <div className="mt-4 h-72">
          {monthlyChartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                      return [formatCurrency(value), name];
                    }
                    return [`${formatNumberValue(value)} đơn`, name];
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
                  name="Số đơn"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Chưa có dữ liệu doanh thu theo tháng.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Doanh thu theo tuần</h2>
            <p className="text-sm text-gray-600 mt-1">
              Theo dõi tuần trong {selectedMonthLabel} {selectedYear || currentYear}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
          {weeklyChartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
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
                      return [formatCurrency(value), name];
                    }
                    return [`${formatNumberValue(value)} đơn`, name];
                  }}
                  labelFormatter={(_, payload) => {
                    if (!payload || !payload.length) return '';
                    const { payload: data } = payload[0];
                    const start = formatDateValue(data.startDate);
                    const end = formatDateValue(data.endDate);
                    return `${data.label}${start !== '--' || end !== '--' ? ` • ${start} - ${end}` : ''}`;
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="Số đơn"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Chưa có dữ liệu doanh thu theo tuần.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueManagement;
