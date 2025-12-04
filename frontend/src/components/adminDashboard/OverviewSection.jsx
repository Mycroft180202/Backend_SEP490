import React, { useMemo, useCallback } from 'react';
import {
  FaDollarSign,
  FaChartLine,
  FaShoppingCart,
  FaUsers,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
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
  overview,
  monthlyData,
  weeklyData,
  selectedYear,
  selectedMonth,
  onChangePeriod,
  formatCurrency,
}) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
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

  const chartData = useMemo(() => {
    const byMonth = new Map(
      (Array.isArray(monthlyData) ? monthlyData : []).map((entry) => [entry.month, entry]),
    );

    return monthNames.map((label, index) => {
      const month = index + 1;
      const entry = byMonth.get(month) || {};
      return {
        monthLabel: label,
        revenue: Number(entry.revenue) || 0,
        orders: Number(entry.orders ?? entry.totalOrderNumber ?? 0) || 0,
      };
    });
  }, [monthNames, monthlyData]);

  const totalUsers = overview.totalSellers + overview.totalCustomers;
  const growth = Number(overview.monthGrowthPercent) || 0;
  const growthState = growth > 0 ? 'up' : growth < 0 ? 'down' : 'flat';
  const growthColor =
    growthState === 'up' ? 'text-green-600' : growthState === 'down' ? 'text-red-600' : 'text-gray-500';
  const GrowthIcon = growthState === 'up' ? FaArrowUp : growthState === 'down' ? FaArrowDown : null;

  const weeklyChartData = useMemo(() => {
    return (Array.isArray(weeklyData) ? weeklyData : []).map((entry) => ({
      label: `Tuần ${entry.weekNumber}`,
      revenue: Number(entry.revenue) || 0,
      orders: Number(entry.totalOrderNumber ?? entry.totalOrderAmount ?? 0) || 0,
    }));
  }, [weeklyData]);

  const formatVND = useCallback((value) => `${(Number(value) || 0).toLocaleString('vi-VN')} VND`, []);

  const renderEmptyChart = (message) => (
    <div className="flex h-72 items-center justify-center text-sm text-gray-500">{message}</div>
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Doanh thu hôm nay</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">{formatVND(overview.todayRevenue)}</h3>
            </div>
            <div className="rounded-full bg-green-100 p-4 text-green-600">
              <FaDollarSign className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Lợi nhuận tháng này</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">{formatVND(overview.monthRevenue)}</h3>
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
              <h3 className="mt-2 text-3xl font-bold text-gray-800">{overview.todayOrders}</h3>
            </div>
            <div className="rounded-full bg-blue-100 p-4 text-blue-600">
              <FaShoppingCart className="text-2xl" />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng người dùng</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">{totalUsers}</h3>
            </div>
            <div className="rounded-full bg-purple-100 p-4 text-purple-600">
              <FaUsers className="text-2xl" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span>Người bán</span>
              <span className="font-semibold text-gray-800">{overview.totalSellers}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span>Người mua</span>
              <span className="font-semibold text-gray-800">{overview.totalCustomers}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Report chờ xử lý</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">{overview.reportCount}</h3>
            </div>
            <div className="rounded-full bg-yellow-100 p-4 text-yellow-600">
              <FaExclamationTriangle className="text-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Doanh thu & đơn hàng theo tháng</h2>
            <span className="text-xs text-gray-500">Đơn vị: VND & đơn</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedYear}
              onChange={(event) => onChangePeriod?.({ year: Number(event.target.value), month: selectedMonth })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Array.from({ length: 5 }, (_, index) => currentYear - index).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(event) => onChangePeriod?.({ year: selectedYear, month: Number(event.target.value) })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {monthNames.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 h-72">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={formatVND} width={80} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  width={50}
                />
                <Tooltip
                  formatter={(value, name, { dataKey }) => (dataKey === 'orders' ? value : formatVND(value))}
                  labelFormatter={(label) => label}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#f5f5f5' }}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
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
            renderEmptyChart('Không có dữ liệu doanh thu và đơn hàng')
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Doanh thu theo tuần</h2>
            <p className="text-xs text-gray-500">Tháng {selectedMonth} • Năm {selectedYear}</p>
          </div>
          <span className="text-xs text-gray-500">Đơn vị: VND & đơn</span>
        </div>
        <div className="mt-4 h-72">
          {weeklyChartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} interval={0} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={formatVND} width={80} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value} đơn`}
                  width={60}
                />
                <Tooltip
                  formatter={(value, name, { dataKey }) =>
                    dataKey === 'orders' ? `${value} đơn` : formatVND(value)
                  }
                  labelFormatter={(label) => label}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#f5f5f5' }}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#f97316"
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
            renderEmptyChart('Không có dữ liệu tuần cho kỳ đã chọn')
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
