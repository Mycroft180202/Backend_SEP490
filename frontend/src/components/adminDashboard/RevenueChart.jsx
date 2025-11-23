import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AdminDashboardService from '../../services/modules/admin/adminDashboardService.jsx';
import { toast } from 'react-toastify';

const RevenueChart = ({ formatCurrency }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  useEffect(() => {
    loadRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const data = await AdminDashboardService.getMonthlyRevenue(year);
      
      // Transform data for chart
      const transformedData = (data || []).map(item => ({
        month: monthNames[item.month - 1],
        revenue: item.revenue,
        totalOrderAmount: item.totalOrderAmount,
        fullMonth: item.month
      }));
      
      setChartData(transformedData);
    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast.error('Không thể tải dữ liệu doanh thu');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentYear = () => new Date().getFullYear();
  const minYear = getCurrentYear() - 1;
  const maxYear = 2028;

  const years = [];
  for (let y = minYear; y <= maxYear; y++) {
    years.push(y);
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 font-alata">Biểu đồ doanh thu</h2>
        <div className="flex gap-4">
          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Chart type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('line')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                chartType === 'line'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Đường
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                chartType === 'bar'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cột
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <p className="text-gray-600 font-nunito">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <p className="text-gray-600 font-nunito">Không có dữ liệu</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Doanh thu"
                dot={{ fill: '#ef4444', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="totalOrderAmount" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Tổng giá trị đơn"
                dot={{ fill: '#3b82f6', r: 5 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px' }}
              />
              <Legend />
              <Bar 
                dataKey="revenue" 
                fill="#ef4444" 
                name="Doanh thu"
              />
              <Bar 
                dataKey="totalOrderAmount" 
                fill="#3b82f6" 
                name="Tổng giá trị đơn"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RevenueChart;
