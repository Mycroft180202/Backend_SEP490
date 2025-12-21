import React, { useMemo, useCallback, useState, useEffect } from 'react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'react-toastify';
import AdminDashboardService from '../../services/modules/admin/adminDashboardService.jsx';

const OverviewSection = ({
  overview,
  monthlyData,
  selectedYear,
  selectedMonth,
  onChangePeriod,
  availableYears,
  onNavigate,
}) => {
  const [pieYear, setPieYear] = useState(selectedYear);
  const [pieMonth, setPieMonth] = useState(selectedMonth);
  const [pieData, setPieData] = useState([]);
  const [pieLoading, setPieLoading] = useState(false);

  const yearOptions = useMemo(() => {
    if (Array.isArray(availableYears) && availableYears.length) {
      return availableYears;
    }
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, index) => currentYear - index);
  }, [availableYears]);
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

  const formatVND = useCallback((value) => `${(Number(value) || 0).toLocaleString('vi-VN')} VND`, []);
  const formatPercent = useCallback((value) => `${(Number(value) || 0).toFixed(2)}%`, []);
  const currentMonthLabel = useMemo(() => monthNames[selectedMonth - 1] || 'hiện tại', [monthNames, selectedMonth]);

  const renderEmptyChart = (message) => (
    <div className="flex h-72 items-center justify-center text-sm text-gray-500">{message}</div>
  );

  const pieColors = useMemo(
    () => ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
    [],
  );

  useEffect(() => {
    setPieYear(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    setPieMonth(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    let ignore = false;

    const fetchRevenuePercentage = async () => {
      if (!pieYear || !pieMonth) {
        setPieData([]);
        return;
      }

      setPieLoading(true);
      try {
        const response = await AdminDashboardService.getRevenuePercentage(pieYear, pieMonth);
        if (!ignore) {
          setPieData(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        if (!ignore) {
          setPieData([]);
          toast.error('Không thể tải phân bổ doanh thu theo danh mục');
        }
      } finally {
        if (!ignore) {
          setPieLoading(false);
        }
      }
    };

    fetchRevenuePercentage();

    return () => {
      ignore = true;
    };
  }, [pieYear, pieMonth]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Doanh thu hôm nay (tạm tính)</p>
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
              <p className="text-sm text-gray-500">Doanh thu {currentMonthLabel}</p>
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
          <button
            type="button"
            onClick={() => onNavigate?.('orders')}
            className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline"
          >
            Xem chi tiết
          </button>
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
              <div>
                <span className="block">Người bán</span>
                <button
                  type="button"
                  onClick={() => onNavigate?.('sellers')}
                  className="mt-1 text-xs font-semibold text-primary hover:underline"
                >
                  Quản lý
                </button>
              </div>
              <span className="font-semibold text-gray-800">{overview.totalSellers}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <div>
                <span className="block">Người mua</span>
                <button
                  type="button"
                  onClick={() => onNavigate?.('customers')}
                  className="mt-1 text-xs font-semibold text-primary hover:underline"
                >
                  Quản lý
                </button>
              </div>
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
          <button
            type="button"
            onClick={() => onNavigate?.('reports')}
            className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline"
          >
            Xử lý ngay
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:gap-8 xl:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Doanh thu & đơn hàng theo tháng</h2>
              <span className="text-xs text-gray-500">Đơn vị: VND & đơn</span>
            </div>
            <select
              value={selectedYear}
              onChange={(event) => onChangePeriod?.({ year: Number(event.target.value), month: selectedMonth })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
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
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Tỷ trọng doanh thu theo danh mục</h2>
              <span className="text-xs text-gray-500">Chọn thời gian để xem phân bổ doanh thu</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={pieYear}
                onChange={(event) => setPieYear(Number(event.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={pieMonth}
                onChange={(event) => setPieMonth(Number(event.target.value))}
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

          <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start">
            <div className="h-72 w-full xl:h-80 xl:w-1/2">
              {pieLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">Đang tải biểu đồ...</div>
              ) : pieData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="revenue"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      label={({ percent }) => formatPercent(percent * 100)}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.categoryId || index} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, payload) => [
                        `${formatVND(value)} • ${formatPercent(payload?.payload?.percentage)}`,
                        payload?.payload?.categoryName || 'Doanh thu',
                      ]}
                      contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#f5f5f5' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  Không có dữ liệu phân bổ
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '20rem' }}>
              {pieData.length ? (
                pieData.map((item, index) => (
                  <div
                    key={item.categoryId || `${item.categoryName}-${index}`}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: pieColors[index % pieColors.length] }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.categoryName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{formatVND(item.revenue)}</p>
                      <p className="text-xs text-gray-500">{formatPercent(item.percentage)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  Không có dữ liệu danh mục
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
