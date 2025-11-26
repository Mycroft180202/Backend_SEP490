import React from 'react';
import {
  FaFileExport,
  FaChartLine,
  FaDollarSign,
  FaWallet,
  FaCalendarAlt,
} from 'react-icons/fa';

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
}).format(Number(amount) || 0);

const RevenueManagement = ({ monthlyRevenue = [], weeklyRevenue = [] }) => {
  const safeMonthly = Array.isArray(monthlyRevenue) ? monthlyRevenue : [];
  const safeWeekly = Array.isArray(weeklyRevenue) ? weeklyRevenue : [];

  const totalRevenue = safeMonthly.reduce(
    (sum, item) => sum + Number(item.revenue || item.totalRevenue || 0),
    0,
  );
  const totalOrderAmount = safeMonthly.reduce(
    (sum, item) => sum + Number(item.totalOrderAmount || 0),
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

  const formatMonthLabel = (month) => {
    if (!month) return '--';
    return `Tháng ${month}`;
  };

  const formatDate = (value) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('vi-VN');
  };

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
              <p className="text-gray-600 text-sm font-nunito">Giá trị đơn hàng</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(totalOrderAmount)}</h3>
              <p className="text-xs text-gray-500 mt-1">Tổng giá trị đã bán</p>
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
                {formatMonthLabel(bestMonth?.month)}
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 font-alata">Doanh thu theo tháng</h2>
            <p className="text-sm text-gray-600 mt-1">Theo dõi hiệu suất 12 tháng</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaFileExport /> Xuất báo cáo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 text-sm">
                <th className="text-left py-3 px-4 font-semibold">Tháng</th>
                <th className="text-left py-3 px-4 font-semibold">Tổng đơn hàng</th>
                <th className="text-left py-3 px-4 font-semibold">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {safeMonthly.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-500">
                    Chưa có dữ liệu doanh thu theo tháng.
                  </td>
                </tr>
              ) : (
                safeMonthly.map((item) => (
                  <tr key={item.month} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="py-3 px-4 font-semibold text-gray-800">{formatMonthLabel(item.month)}</td>
                    <td className="py-3 px-4">{formatCurrency(item.totalOrderAmount || 0)}</td>
                    <td className="py-3 px-4 text-primary font-semibold">{formatCurrency(item.revenue || 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 font-alata">Doanh thu theo tuần</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 text-sm">
                <th className="text-left py-3 px-4 font-semibold">Tuần</th>
                <th className="text-left py-3 px-4 font-semibold">Bắt đầu</th>
                <th className="text-left py-3 px-4 font-semibold">Kết thúc</th>
                <th className="text-left py-3 px-4 font-semibold">Tổng đơn hàng</th>
                <th className="text-left py-3 px-4 font-semibold">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {safeWeekly.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    Chưa có dữ liệu doanh thu theo tuần.
                  </td>
                </tr>
              ) : (
                safeWeekly.map((week) => (
                  <tr key={week.weekNumber} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                    <td className="py-3 px-4 font-semibold text-gray-800">Tuần {week.weekNumber}</td>
                    <td className="py-3 px-4">{formatDate(week.startDate)}</td>
                    <td className="py-3 px-4">{formatDate(week.endDate)}</td>
                    <td className="py-3 px-4">{formatCurrency(week.totalOrderAmount || 0)}</td>
                    <td className="py-3 px-4 text-primary font-semibold">{formatCurrency(week.revenue || 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueManagement;
